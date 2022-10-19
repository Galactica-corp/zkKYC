pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkleProof.circom";
include "./calculateZkCertHash.circom";

/*
Circuit to check that, given zkKYC infos we calculate the corresponding leaf hash
*/
template RangeProof(levels){
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

    // public time inputs
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;

    // age threshold
    signal input ageThreshold;

    // variables related to the merkle proof
    signal input pathElements[levels];
    signal input pathIndices;
    signal input root;

    // final result
    signal output valid;

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

    // check that user is older than the age threshold
    /* component validCaseOne = GreaterThan(128);
    validCaseOne.in[0] <== currentYear;
    validCaseOne.in[1] <== yearOfBirth + ageThreshold; */

    /* var validCaseTwo = 0;
    if (currentYear == yearOfBirth + ageThreshold) {
        if (currentMonth > monthOfBirth) {
            validCaseTwo = 1;
        } else {
            if ((currentMonth == monthOfBirth) && (dayOfBirth >= dayOfBirth)) {
                validCaseTwo = 1;
            }
        }
    }

    valid <== (validCaseOne.out || validCaseTwo); */
    /* valid <== validCaseOne.out; */

    component compare1 = GreaterThan(128);
    compare1.in[0] <== currentYear;
    compare1.in[1] <== yearOfBirth + ageThreshold;
    var _valid = 0;

    if (compare1.out) {
        _valid = 1;
    }
    /* if (currentYear > yearOfBirth + ageThreshold) {
        _valid = 1;
    } else {
        if (currentYear == yearOfBirth + ageThreshold) {
            if (currentMonth > monthOfBirth) {
                _valid = 1;
            } else {
                if ((currentMonth == monthOfBirth) && (dayOfBirth >= dayOfBirth)) {
                    _valid = 1;
                }
            }
        }
    } */
    valid <== _valid;
}