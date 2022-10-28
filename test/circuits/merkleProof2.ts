import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';

describe('Merkle Proof 2 Circuit Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/merkleProof_2.json', 'utf8')
  );

  const sanityCheck = true;
  let expectedRoot =
    '17029810224651811805425930092085496299322617147701484775397986650506962045188';

  before(async () => {
    circuit = await hre.circuitTest.setup('merkleProof2');
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

    assert.propertyVal(witness, 'main.leaf', sampleInput.leaf);
    assert.propertyVal(
      witness,
      'main.pathIndices',
      BigInt(sampleInput.pathIndices).toString()
    );
    // check resulting root as output
    assert.propertyVal(witness, 'main.root', expectedRoot);
  });

  it('has the correct root as output', async () => {
    const expected = { root: expectedRoot };
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.assertOut(witness, expected);
  });

  it('output changes on having a different leaf', async () => {
    let forgedInput = { ...sampleInput };
    forgedInput.leaf += 1;
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.notPropertyVal(witness, 'main.root', expectedRoot);
  });

  it('output changes on having a different path', async () => {
    let forgedInput = { ...sampleInput };
    forgedInput.pathIndices -= 1; // flip some bits to have a different path
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.notPropertyVal(witness, 'main.root', expectedRoot);
  });

  it('output changes on having a different neighbor hashes', async () => {
    let forgedInput = { ...sampleInput };
    forgedInput.pathElements[1] = forgedInput.pathElements[2];
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.notPropertyVal(witness, 'main.root', expectedRoot);
  });
});
