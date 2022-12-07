pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/gates.circom";
include "./ageProof.circom";
include "./zkKYC.circom";

/*
Circuit to check that, given zkKYC infos we calculate the corresponding leaf hash
*/
template AgeProofZkKYC(levels){
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

    // pub key of the provider
    signal input providerAx;
    signal input providerAy;

    // provider's EdDSA signature of the leaf hash
    signal input providerS;
    signal input providerR8x;
    signal input providerR8y;
    // TODO: check that the signature is valid

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

    // final result
    signal output valid;

    component zkKYC = ZKKYC(levels);
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
