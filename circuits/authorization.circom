pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

/*
  Circuit verifying that the onchain message sender is authorized to use the zkKYC record.
  He proves this fact by providing his address signed by the account hidden behind the holder commitment of the zkKYC rcord.

*/
template Authorization(){

    // message to be signed, this will be a public input so the SC can compare it with the onchain message sender
    signal input userAddress;
    // pubkey of the account behind holder commitment
    signal input Ax;
    signal input Ay;
    // EdDSA signature
    signal input S;
    signal input R8x;
    signal input R8y;

    // circuit has no output, because adding constraints is enough to verify the signature

    // using the standard EdDSA circuit from circomlib to verify the signature
    component eddsa = EdDSAPoseidonVerifier();
    eddsa.enabled <== 1;
    eddsa.M <== userAddress;
    eddsa.Ax <== Ax;
    eddsa.Ay <== Ay;
    eddsa.S <== S;
    eddsa.R8x <== R8x;
    eddsa.R8y <== R8y;
}
