pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkleProof.circom";
include "./calculateZkCertHash.circom";
include "./authorization.circom";
include "./ownership.circom";

/*
Circuit to check that, given zkKYC infos we calculate the corresponding leaf hash
*/
template ZKKYC(levels){
    // zkKYC infos
    signal input surname;
    signal input forename;
    signal input middlename;
    signal input yearOfBirth;
    signal input monthOfBirth;
    signal input dayOfBirth;
    signal input verificationLevel;
    signal input expirationDate;
    signal input holderCommitment;
    signal input providerSignature;
    signal input randomSalt;
    signal input streetAndNumber;
    signal input postcode;
    signal input town;
    signal input region;
    signal input country;

    // variables related to the merkle proof
    signal input pathElements[levels];
    signal input pathIndices;
    signal input root;
    signal input currentTime;
    signal output valid;

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

    component ownership = Ownership();
    ownership.holderCommitment <== holderCommitment;
    ownership.Ax <== Ax;
    ownership.Ay <== Ay;
    ownership.S <== S;
    ownership.R8x <== R8x;
    ownership.R8y <== R8y;

    signal output valid;

    component authorization = Authorization();
    authorization.userAddress <== userAddress;
    authorization.Ax <== Ax;
    authorization.Ay <== Ay;
    authorization.S <== S2;
    authorization.R8x <== R8x2;
    authorization.R8y <== R8y2;

    // calculation using a Poseidon component
    component _zkCertHash = CalculateZkCertHash();
    _zkCertHash.surname <== surname;
    _zkCertHash.forename <== forename;
    _zkCertHash.middlename <== middlename;
    _zkCertHash.yearOfBirth <== yearOfBirth;
    _zkCertHash.monthOfBirth <== monthOfBirth;
    _zkCertHash.dayOfBirth <== dayOfBirth;
    _zkCertHash.verificationLevel <== verificationLevel;
    _zkCertHash.expirationDate <== expirationDate;
    _zkCertHash.holderCommitment <== holderCommitment;
    _zkCertHash.providerSignature <== providerSignature;
    _zkCertHash.randomSalt <== randomSalt;
    _zkCertHash.streetAndNumber <== streetAndNumber;
    _zkCertHash.postcode <== postcode;
    _zkCertHash.town <== town;
    _zkCertHash.region <== region;
    _zkCertHash.country <== country;



    // use the merkle proof component to calculate the root
    component _merkleProof = MerkleProof(levels);
    _merkleProof.leaf <== _zkCertHash.zkCertHash;
    for (var i = 0; i < levels; i++) {
        _merkleProof.pathElements[i] <== pathElements[i];
    }
    _merkleProof.pathIndices <== pathIndices;

    // check that the calculated root is equal to the public root
    root === _merkleProof.root;

    // check that the time has not expired
    component timeHasntPassed = GreaterThan(128);
    timeHasntPassed.in[0] <== expirationDate;
    timeHasntPassed.in[1] <== currentTime;

    valid <== timeHasntPassed.out;

}
