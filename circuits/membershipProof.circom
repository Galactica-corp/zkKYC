pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkleProof.circom";
include "./calculateZkCertHash.circom";

/*
Circuit to check that, given zkCert infos we calculate the corresponding leaf hash
*/
template MembershipProof(){
    // zkCert infos
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

    // variables related to the merkle proof
    signal input pathElements[32];
    signal input pathIndices;
    signal input root;
    signal input currentTime;
    signal output valid;

    // use the merkle proof component to calculate the root
    component _merkleProof = MerkleProof(32);
    _merkleProof.leaf <== _zkCertHash.zkCertHash;
    for (var i = 0; i < 32; i++) {
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
