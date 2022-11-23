import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';

describe('Age Proof combined with zkKYC Circuit Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/ageProofZkKYC.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('ageProofZkKYC');
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

    assert.propertyVal(
      witness,
      'main.ageThreshold',
      sampleInput.ageThreshold.toString()
    );
    // check resulting root as output
    assert.propertyVal(witness, 'main.valid', '1');
  });
});
