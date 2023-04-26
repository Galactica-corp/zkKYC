pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

/*
  Circuit verifying the ownership of a zkCertificate with a signature in the holder commitment.

  For efficient computation in zkSNARKs, it uses the EdDSA signature scheme
  (https://iden3-docs.readthedocs.io/en/latest/iden3_repos/research/publications/zkproof-standards-workshop-2/ed-dsa/ed-dsa.html)
  with the Poseidon hash function (https://www.poseidon-hash.info/).
*/
template Ownership(){
    // holderCommitment = poseidon(eddsa(poseidon(pubkey)))  // fixing the owner address while hiding it from the provider
    signal input holderCommitment;
    // TODO: sign receiver address to prevent replay attacks

    // poseidon hash of the message to be signed
    // public key of the signer
    signal input Ax;
    signal input Ay;
    // EdDSA signature
    signal input S;
    signal input R8x;
    signal input R8y;

    signal output valid;

    // circuit has no output, because adding constraints is enough to verify the signature

    // the message to be signed is the hashed pubkey in the holder commitment
    component hashPubkey = Poseidon(2);
    hashPubkey.inputs[0] <== Ax;
    hashPubkey.inputs[1] <== Ay;

    // transforming hash into field element accepted by eddsa (smaller so take modulo)
    signal hashPubkeyMod <-- hashPubkey.out % 2736030358979909402780800718157159386076813972158567259200215660948447373040;

    // using the standard EdDSA circuit from circomlib to verify the signature
    component eddsa = EdDSAPoseidonVerifier();
    eddsa.enabled <== 1;
    eddsa.M <== hashPubkeyMod;
    eddsa.Ax <== Ax;
    eddsa.Ay <== Ay;
    eddsa.S <== S;
    eddsa.R8x <== R8x;
    eddsa.R8y <== R8y;

    // check that the holder commitment matches the signature
    component hashSig = Poseidon(3);
    hashSig.inputs[0] <== S;
    hashSig.inputs[1] <== R8x;
    hashSig.inputs[2] <== R8y;

    component commitmentMatching = IsEqual();
    commitmentMatching.in[0] <== hashSig.out;
    commitmentMatching.in[1] <== holderCommitment;
    commitmentMatching.out === 1;
    valid <== commitmentMatching.out;
}
