pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";

/*
Circuit to check that, given zkCert infos we calculate the corresponding leaf hash
*/
template CalculateZkCertHash(){
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
    signal input holderCommitment;
    signal input providerSignature;
    signal input randomSalt;

    // zkCertHash as output
    signal output zkCertHash;

    // calculation using a Poseidon component
    component _zkCertHash = Poseidon(13);
    _zkCertHash.inputs[0] <== surname;
    _zkCertHash.inputs[1] <== forename;
    _zkCertHash.inputs[2] <== middlename;
    _zkCertHash.inputs[3] <== yearOfBirth;
    _zkCertHash.inputs[4] <== monthOfBirth;
    _zkCertHash.inputs[5] <== dayOfBirth;
    _zkCertHash.inputs[6] <== country;
    _zkCertHash.inputs[7] <== verificationLevel;
    _zkCertHash.inputs[8] <== expirationDate;
    _zkCertHash.inputs[9] <== residentialAddress;
    _zkCertHash.inputs[10] <== holderCommitment;
    _zkCertHash.inputs[11] <== providerSignature;
    _zkCertHash.inputs[12] <== randomSalt;

    zkCertHash <== _zkCertHash.out;
}
