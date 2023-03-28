pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/poseidon.circom";

/*
Circuit to check that, given zkKYC infos we calculate the corresponding leaf hash
*/
template CalculateZkCertHash(){
    // zkKYC infos
    signal input contentHash;
    signal input providerAx;
    signal input providerAy;
    signal input providerS;
    signal input providerR8x;
    signal input providerR8y;
    signal input holderCommitment;
    signal input randomSalt;

    // zkCertHash as output
    signal output zkCertHash;

    // calculation using a Poseidon component
    component _zkCertHash = Poseidon(8);
    _zkCertHash.inputs[0] <== contentHash;
    _zkCertHash.inputs[1] <== providerAx;
    _zkCertHash.inputs[2] <== providerAy;
    _zkCertHash.inputs[3] <== providerS;
    _zkCertHash.inputs[4] <== providerR8x;
    _zkCertHash.inputs[5] <== providerR8y;
    _zkCertHash.inputs[6] <== holderCommitment;
    _zkCertHash.inputs[7] <== randomSalt;

    zkCertHash <== _zkCertHash.out;
}
