pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkleProof.circom";

/*
Circuit to check that, given zkCert infos we calculate the corresponding leaf hash
*/
template membershipProof(){
    // zkCert infos
    signal input surname;
    signal input forename;
    signal input middlename;
    signal input yearOfBirth;
    signal input monthOfBirth;
    signal input dayOfBirth;
    signal input country;
    signal input verificationLevel;
    signal input expirationDate;
    signal input residentialAddress;
    signal input onchainAddress;
    signal input providerSignature;
    signal input randomSalt;


    // calculation using a Poseidon component
    component _zkCertHash = Poseidon(13);
    _zkCertHash.inputs[0] <== surname;
    _zkCertHash.inputs[1] <== forename;
    _zkCertHash.inputs[2] <== middleName;
    _zkCertHash.inputs[3] <== yearOfBirth;
    _zkCertHash.inputs[4] <== monthOfBirth;
    _zkCertHash.inputs[5] <== dayOfBirth;
    _zkCertHash.inputs[6] <== country;
    _zkCertHash.inputs[7] <== verificationLevel;
    _zkCertHash.inputs[8] <== expirationDate;
    _zkCertHash.inputs[9] <== residentialAddress;
    _zkCertHash.inputs[10] <== onchainAddress;
    _zkCertHash.inputs[11] <== providerSignature;
    _zkCertHash.inputs[12] <== randomSalt;

    // variables related to the merkle proof
    signal input pathElements[32];
    signal input pathIndices;
    signal input root;
    signal input currentTime;
    signal output valid;

    // use the merkle proof component to calculate the root
    component _merkleProof = MerkleProof(32);
    _merkleProof.leaf <== _zkCertHash.zkCertHash;
    _merkleProof.pathElements <== pathElements;
    _merkleProof.pathIndices <== pathIndices;

    // check that the calculated root is equal to the public root
    root === _merkleProof.root;

    // check that the time has not expired
    component timeHasntPassed = GreaterThan(128);
    timeHasntPassed.in[0] <== currentTime;
    timeHasntPassed.in[1] <== expirationDate;

    valid <== timeHasntPassed.out;

}
