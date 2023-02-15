import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildPoseidon } from 'circomlibjs';
import { zkCertCommonFields } from '../../lib/zkCertStandards';

describe('Calculate zkCert Hash Circuit Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/calculateZkCertHash.json', 'utf8')
  );

  const sanityCheck = true;
  let expectedHash: string;

  before(async () => {
    circuit = await hre.circuitTest.setup('calculateZkCertHash');
    let poseidon = await buildPoseidon();
    expectedHash = poseidon.F.toObject(
      poseidon(
        zkCertCommonFields.map((field) => sampleInput[field]),
        undefined,
        1
      )
    ).toString();
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
      'main.holderCommitment',
      sampleInput.holderCommitment
    );
    assert.propertyVal(witness, 'main.contentHash', sampleInput.contentHash);
    // check resulting root as output
    assert.propertyVal(witness, 'main.zkCertHash', expectedHash);
  });
});
