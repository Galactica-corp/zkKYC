const snarkjs = require('snarkjs');
const fs = require('fs');

export async function createProof(inputs, ) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    'circuit.wasm',
    'circuit_final.zkey'
  );


}
