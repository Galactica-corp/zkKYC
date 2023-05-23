/* Copyright (C) 2023 Galactica Network. This file is part of zkKYC. zkKYC is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. zkKYC is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. */
pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/gates.circom";
include "./ageProof.circom";
include "./zkKYC.circom";

/**
 * Circuit to check that, given zkKYC infos we calculate the corresponding leaf hash
 *
 * @param levels - number of levels of the merkle tree.
 * @param maxExpirationLengthDays - maximum number of days that a verificationSBT can be valid for
 * @param shamirK - number of shares needed from investigation authorities to reconstruct the zkKYC DID
 * @param shamirN - number of investigation authorities to generate shares for. (Use 0 to disable fraud investigations)
 */
template AgeProofZkKYC(levels, maxExpirationLengthDays, shamirK, shamirN){
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



    // public variables related to age proof circuit
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;

    // age threshold
    signal input ageThreshold;

    //inputs for encryption of fraud investigation data
    signal input userPrivKey;
    signal input investigationInstitutionPubKey[2*shamirN]; // should be public so we can check that it is the same as the current fraud investigation institution public key

    //humanID related variable
    //humanID as public input, so dApp can use it
    signal input humanID;
    //dAppAddress is public so it can be checked by the dApp
    signal input dAppAddress;


    // pub key of the provider
    signal input providerAx;
    signal input providerAy;

    // provider's EdDSA signature of the leaf hash
    signal input providerS;
    signal input providerR8x;
    signal input providerR8y;

    // final result
    signal output userPubKey[2]; // becomes public as part of the output to check that it corresponds to user address
    signal output encryptedData[2*shamirN]; // becomes public as part of the output to be stored in the verification SBT
    signal output valid;
    signal output verificationExpiration; 

    component zkKYC = ZKKYC(levels, maxExpirationLengthDays, shamirK, shamirN);
    zkKYC.holderCommitment <== holderCommitment;
    zkKYC.randomSalt <== randomSalt;
    zkKYC.surname <== surname;
    zkKYC.forename <== forename;
    zkKYC.middlename <== middlename;
    zkKYC.yearOfBirth <== yearOfBirth;
    zkKYC.monthOfBirth <== monthOfBirth;
    zkKYC.dayOfBirth <== dayOfBirth;
    zkKYC.verificationLevel <== verificationLevel;
    zkKYC.expirationDate <== expirationDate;
    zkKYC.streetAndNumber <== streetAndNumber;
    zkKYC.postcode <== postcode;
    zkKYC.town <== town;
    zkKYC.region <== region;
    zkKYC.country <== country;
    zkKYC.passportID <== passportID;
    zkKYC.citizenship <== citizenship;
    zkKYC.userPrivKey <== userPrivKey;
    for (var i = 0; i < 2*shamirN; i++) {
        zkKYC.investigationInstitutionPubKey[i] <== investigationInstitutionPubKey[i];
    }
    zkKYC.providerAx <== providerAx;
    zkKYC.providerAy <== providerAy;
    zkKYC.providerS <== providerS;
    zkKYC.providerR8x <== providerR8x;
    zkKYC.providerR8y <== providerR8y;
    for (var i = 0; i < levels; i++) {
        zkKYC.pathElements[i] <== pathElements[i];
    }
    zkKYC.pathIndices <== pathIndices;
    zkKYC.root <== root;
    zkKYC.currentTime <== currentTime;
    zkKYC.Ax <== Ax;
    zkKYC.Ay <== Ay;
    zkKYC.S <== S;
    zkKYC.R8x <== R8x;
    zkKYC.R8y <== R8y;
    zkKYC.userAddress <== userAddress;
    zkKYC.S2 <== S2;
    zkKYC.R8x2 <== R8x2;
    zkKYC.R8y2 <== R8y2;
    zkKYC.humanID <== humanID;
    zkKYC.dAppAddress <== dAppAddress;
    userPubKey[0] <== zkKYC.userPubKey[0];
    userPubKey[1] <== zkKYC.userPubKey[1];
    for (var i = 0; i < 2*shamirN; i++) {
        encryptedData[i] <== zkKYC.encryptedData[i];
    }
    verificationExpiration <== zkKYC.verificationExpiration;

    component ageProof = AgeProof();
    ageProof.yearOfBirth <== yearOfBirth;
    ageProof.monthOfBirth <== monthOfBirth;
    ageProof.dayOfBirth <== dayOfBirth;
    ageProof.currentYear <== currentYear;
    ageProof.currentMonth <== currentMonth;
    ageProof.currentDay <== currentDay;
    ageProof.ageThreshold <== ageThreshold;

    component and = AND();
    and.a <== zkKYC.valid;
    and.b <== ageProof.valid;

    valid <== and.out;
}
