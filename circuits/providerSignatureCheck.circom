pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

/*
  Circuit verifying that provider signature is correctly submitted

*/
template ProviderSignatureCheck(){

    signal input contentHash;
    signal input holderCommitment;

    signal input providerAx;
    signal input providerAy;
    signal input providerS;
    signal input providerR8x;
    signal input providerR8y;


    // circuit has no output, because adding constraints is enough to verify the signature

    // provider signature verification
    component messageSignedByProvider = Poseidon(2);
    messageSignedByProvider.inputs[0] <== contentHash;
    messageSignedByProvider.inputs[1] <== holderCommitment;

    // transforming hash into field element accepted by eddsa (smaller so take modulo)
    signal messageSignedByProviderMod <-- messageSignedByProvider.out % 2736030358979909402780800718157159386076813972158567259200215660948447373040;

    // using the standard EdDSA circuit from circomlib to verify the signature
    component eddsa = EdDSAPoseidonVerifier();
    eddsa.enabled <== 1;
    eddsa.M <== messageSignedByProviderMod;
    eddsa.Ax <== providerAx;
    eddsa.Ay <== providerAy;
    eddsa.S <== providerS;
    eddsa.R8x <== providerR8x;
    eddsa.R8y <== providerR8y;

}
