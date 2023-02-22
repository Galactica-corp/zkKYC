import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { generateZKKYCInput } from '../../scripts/generateZKKYCInput';

describe('Age Proof combined with zkKYC Circuit Component', () => {
  let circuit: CircuitTestUtils;

  let sampleInput: any;

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('ageProofZkKYC');
    // inputs to create proof
    sampleInput = await generateZKKYCInput();
    const today = new Date(Date.now());
    sampleInput.currentYear = today.getUTCFullYear();
    sampleInput.currentMonth = today.getUTCMonth() + 1;
    sampleInput.currentDay = today.getUTCDate();
    sampleInput.ageThreshold = 18;

    // advance time a bit to set it later in the test
    sampleInput.currentTime += 100;

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
