/* Copyright (C) 2023 Galactica Network. This file is part of zkKYC. zkKYC is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. zkKYC is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. */
pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkleProof.circom";
include "./calculateZkCertHash.circom";
include "./authorization.circom";
include "./ownership.circom";
include "./encryptionProof.circom";
include "./humanID.circom";
include "./providerSignatureCheck.circom";

/**
 * Circuit to check that, given zkKYC infos we calculate the corresponding leaf hash
 *
 * @param levels - number of levels of the merkle tree.
 * @param maxExpirationLengthDays - maximum number of days that a verificationSBT can be valid for
 */
template ZKKYC(levels, maxExpirationLengthDays){
    signal input holderCommitment;
    signal input randomSalt;

    // zkKYC data fields
    signal input surname;
    signal input forename;
    signal input middlename;
    signal input yearOfBirth;
    signal input monthOfBirth;
    signal input dayOfBirth;
    signal input verificationLevel;
    signal input expirationDate;
    signal input streetAndNumber;
    signal input postcode;
    signal input town;
    signal input region;
    signal input country;
    signal input citizenship;
    signal input passportID;

    // provider's EdDSA signature of the leaf hash
    signal input providerS;
    signal input providerR8x;
    signal input providerR8y;

    // variables related to the merkle proof
    signal input pathElements[levels];
    signal input pathIndices;
    signal input root;
    signal input currentTime;

    // verify that proof creator indeed owns the pubkey behind the holdercommitment
    // public key of the signer
    signal input Ax;
    signal input Ay;
    // EdDSA signature of the pubkey
    signal input S;
    signal input R8x;
    signal input R8y;

    // verify that tx sender is authorized to use the proof
    // user address as message to be signed, this will be a public input so the SC can compare it with the onchain message sender
    signal input userAddress;
    // EdDSA signature of the user address
    signal input S2;
    signal input R8x2;
    signal input R8y2;

    //inputs for encryption of fraud investigation data
    signal input userPrivKey;
    signal input investigationInstitutionPubKey[2]; // should be public so we can check that it is the same as the current fraud investigation institution public key

    //humanID related variable
    //humanID as public input, so dApp can use it
    signal input humanID;

    //dAppAddress is public so it can be checked by the dApp
    signal input dAppAddress;

    // pub key of the provider
    signal input providerAx;
    signal input providerAy;

    signal output userPubKey[2]; // becomes public as part of the output to check that it corresponds to user address
    signal output encryptedData[2]; // becomes public as part of the output to be stored in the verification SBT
    signal output valid;
    signal output verificationExpiration; 


    // we don't need to check the output 'valid' of the ownership circuit because it is always 1
    component ownership = Ownership();
    ownership.holderCommitment <== holderCommitment;
    ownership.Ax <== Ax;
    ownership.Ay <== Ay;
    ownership.S <== S;
    ownership.R8x <== R8x;
    ownership.R8y <== R8y;
    
    ownership.valid === 1;

    component authorization = Authorization();
    authorization.userAddress <== userAddress;
    authorization.Ax <== Ax;
    authorization.Ay <== Ay;
    authorization.S <== S2;
    authorization.R8x <== R8x2;
    authorization.R8y <== R8y2; 

    // content hash for zkKYC data
    component contentHash = Poseidon(15);
    contentHash.inputs[0] <== surname;
    contentHash.inputs[1] <== forename;
    contentHash.inputs[2] <== middlename;
    contentHash.inputs[3] <== yearOfBirth;
    contentHash.inputs[4] <== monthOfBirth;
    contentHash.inputs[5] <== dayOfBirth;
    contentHash.inputs[6] <== verificationLevel;
    contentHash.inputs[7] <== expirationDate;
    contentHash.inputs[8] <== streetAndNumber;
    contentHash.inputs[9] <== postcode;
    contentHash.inputs[10] <== town;
    contentHash.inputs[11] <== region;
    contentHash.inputs[12] <== country;
    contentHash.inputs[13] <== citizenship;
    contentHash.inputs[14] <== passportID;

    // provider signature verification
    component providerSignatureCheck = ProviderSignatureCheck();
    providerSignatureCheck.contentHash <== contentHash.out;
    providerSignatureCheck.holderCommitment <== holderCommitment;
    providerSignatureCheck.providerAx <== providerAx;
    providerSignatureCheck.providerAy <== providerAy;
    providerSignatureCheck.providerS <== providerS;
    providerSignatureCheck.providerR8x <== providerR8x;
    providerSignatureCheck.providerR8y <== providerR8y;

    // calculation using a Poseidon component
    component _zkCertHash = CalculateZkCertHash();
    _zkCertHash.contentHash <== contentHash.out;
    _zkCertHash.providerAx <== providerAx;
    _zkCertHash.providerAy <== providerAy;
    _zkCertHash.providerS <== providerS;
    _zkCertHash.providerR8x <== providerR8x;
    _zkCertHash.providerR8y <== providerR8y;
    _zkCertHash.holderCommitment <== holderCommitment;
    _zkCertHash.randomSalt <== randomSalt;

    // use the merkle proof component to calculate the root
    component _merkleProof = MerkleProof(levels);
    _merkleProof.leaf <== _zkCertHash.zkCertHash;
    for (var i = 0; i < levels; i++) {
        _merkleProof.pathElements[i] <== pathElements[i];
    }
    _merkleProof.pathIndices <== pathIndices;

    // check that the calculated root is equal to the public root
    root === _merkleProof.root;

    //check that the encrypted fraud investigation data is correctly created
    component _encryptionProof = encryptionProof();
    _encryptionProof.senderPrivKey <== userPrivKey;
    _encryptionProof.receiverPubKey[0] <== investigationInstitutionPubKey[0];
    _encryptionProof.receiverPubKey[1] <== investigationInstitutionPubKey[1];
    _encryptionProof.msg[0] <== providerAx;
    _encryptionProof.msg[1] <== _zkCertHash.zkCertHash;

    userPubKey[0] <== _encryptionProof.senderPubKey[0];
    userPubKey[1] <== _encryptionProof.senderPubKey[1];
    encryptedData[0] <== _encryptionProof.encryptedMsg[0];
    encryptedData[1] <== _encryptionProof.encryptedMsg[1];

    component calculateHumanId = HumanID();
    calculateHumanId.surname <== surname;
    calculateHumanId.forename <== forename;
    calculateHumanId.middlename <== middlename;
    calculateHumanId.yearOfBirth <== yearOfBirth;
    calculateHumanId.monthOfBirth <== monthOfBirth;
    calculateHumanId.dayOfBirth <== dayOfBirth;
    calculateHumanId.passportID <== passportID;
    calculateHumanId.dAppAddress <== dAppAddress;
    
    calculateHumanId.humanID === humanID;

    // check that the time has not expired
    component timeHasntPassed = GreaterThan(128);
    timeHasntPassed.in[0] <== expirationDate;
    timeHasntPassed.in[1] <== currentTime;

    // the expiration date of the resulting Verification SBT should not equal the expiration date
    // of the zkKYC data to leak less information that could make it possible to trace the user
    // So we take a date a fixed time in the future, but latest at the zkKYC expiration
    var verificationExpirationMax = currentTime + maxExpirationLengthDays * 24 * 60 * 60;
    verificationExpiration <-- expirationDate < verificationExpirationMax ? expirationDate : verificationExpirationMax;
    component verificationExpirationMaxCheck = LessEqThan(32); // 32 bits are enough for unix timestamps until year 2106
    verificationExpirationMaxCheck.in[0] <== verificationExpiration;
    verificationExpirationMaxCheck.in[1] <== verificationExpiration;
    verificationExpirationMaxCheck.out === 1;

    valid <== timeHasntPassed.out;
}
