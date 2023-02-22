import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';

describe.only('zkKYC Circuit Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/zkKYC.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('zkKYC');
  });

  it('produces a witness with valid constraints', async () => {
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.checkConstraints(witness);
  });

  it('has expected witness values', async () => {
    const witness = await circuit.calculateLabeledWitness(
      sampleInput,
      sanityCheck
    );

    assert.propertyVal(witness, 'main.randomSalt', sampleInput.randomSalt.toString());
    assert.propertyVal(
      witness,
      'main.pathIndices',
      BigInt(sampleInput.pathIndices).toString()
    );
    // check resulting root as output
    assert.propertyVal(witness, 'main.valid', '1');
  });
  it('the proof is not valid if the expiration time has passed', async () => {
    let forgedInput = { ...sampleInput };
    forgedInput.currentTime = forgedInput.expirationDate + 1;
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.propertyVal(witness, 'main.valid', '0');
  });
});
