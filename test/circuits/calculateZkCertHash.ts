import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildPoseidon } from 'circomlibjs';

describe('Calculate zkCert Hash Circuit Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/calculateZkCertHash.json', 'utf8')
  );

  const sanityCheck = true;
  let expectedHash: string;
  const fieldOrder = [
    'surname',
    'forename',
    'middlename',
    'yearOfBirth',
    'monthOfBirth',
    'dayOfBirth',
    'verificationLevel',
    'expirationDate',
    'holderCommitment',
    'providerSignature',
    'randomSalt',
    'streetAndNumber',
    'postcode',
    'town',
    'region',
    'country',
  ];

  before(async () => {
    circuit = await hre.circuitTest.setup('calculateZkCertHash');
    let poseidon = await buildPoseidon();
    expectedHash = poseidon.F.toObject(
      poseidon(
        fieldOrder.map((field) => sampleInput[field]),
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
    assert.propertyVal(witness, 'main.surname', sampleInput.surname);
    assert.propertyVal(witness, 'main.country', sampleInput.country);
    // check resulting root as output
    assert.propertyVal(witness, 'main.zkCertHash', expectedHash);
  });
});
