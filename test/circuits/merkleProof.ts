import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';

describe('Merkle Proof Circuit Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/merkleProof.json', 'utf8')
  );
  const expectedRoot =
    '9091466005283815162448404040090924144531762766638646206839479435316552583073';

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('merkleProof');
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
    console.log('hey');
    assert.propertyVal(witness, 'main.leaf', '0');
    assert.propertyVal(witness, 'main.pathIndices', '5');
    // check resulting root as output
    assert.propertyVal(witness, 'main.root', expectedRoot);
  });

  it('has the correct root as output', async () => {
    const expected = { root: expectedRoot };
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.assertOut(witness, expected);
  });

  it('output changes on having a different leaf', async () => {
    let forgedInput = sampleInput;
    forgedInput.leaf += 1;
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.notPropertyVal(witness, 'main.root', expectedRoot);
  });

  it('output changes on having a different path', async () => {
    let forgedInput = sampleInput;
    forgedInput.pathIndices -= 1; // flip some bits to have a different path
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.notPropertyVal(witness, 'main.root', expectedRoot);
  });

  it('output changes on having a different neighbor hashes', async () => {
    let forgedInput = sampleInput;
    forgedInput.pathElements[1] = forgedInput.pathElements[2];
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.notPropertyVal(witness, 'main.root', expectedRoot);
  });
});
