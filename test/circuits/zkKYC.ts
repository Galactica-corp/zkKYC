import { assert } from 'chai';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { generateZKKYCInput } from '../../scripts/generateZKKYCInput';

describe('zkKYC Circuit Component', () => {
  let circuit: CircuitTestUtils;
  let sampleInput: any;

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('zkKYC');
    sampleInput = await generateZKKYCInput();
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
      'main.randomSalt',
      sampleInput.randomSalt.toString()
    );
    assert.propertyVal(
      witness,
      'main.pathIndices',
      BigInt(sampleInput.pathIndices).toString()
    );

    assert.propertyVal(witness, 'main.valid', '1', "proof should be valid");

    const maxValidityLength = 60*24*60*60; // 60 days according to parameter
    assert.propertyVal(
      witness,
      'main.verificationExpiration',
      `${sampleInput.currentTime + maxValidityLength}`,
      "expiration of Verification SBT should be capped by the max validity duration parameter"
    );
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
