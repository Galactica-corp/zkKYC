pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/eddsaposeidon.circom";

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

    // circuit has no output, because adding constraints is enough to verify the signature

    // the message to be signed is the hashed pubkey in the holder commitment
    component hashPubkey = Poseidon(2);
    hashPubkey.in[0] <== Ax;
    hashPubkey.in[1] <== Ay;

    // using the standard EdDSA circuit from circomlib to verify the signature
    component eddsa = EdDSAPoseidonVerifier();
    eddsa.enabled <== 1;
    eddsa.M <== hashPubkey.out;
    eddsa.Ax <== Ax;
    eddsa.Ay <== Ay;
    eddsa.S <== S;
    eddsa.R8x <== R8x;
    eddsa.R8y <== R8y;

    // check that the holder commitment matches the signature
    component hashSig = Poseidon(3);
    hashSig.in[0] <== S;
    hashSig.in[1] <== R8x;
    hashSig.in[2] <== R8y;
    hashSig.out === holderCommitment;
}
