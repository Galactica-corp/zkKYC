import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';

describe('Calculate zkCert Hash Circuit Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/calculateZkCertHash.json', 'utf8')
  );
  const expectedHash =
    '7512231847802664672663691472105877274361268964007999569485884068600615154623';

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('calculateZkCertHash');
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
    assert.propertyVal(witness, 'main.surname', sampleInput.surname);
    assert.propertyVal(witness, 'main.country', sampleInput.country);
    // check resulting root as output
    assert.propertyVal(witness, 'main.zkCertHash', expectedHash);
  });
});
