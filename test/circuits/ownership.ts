import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildEddsa } from 'circomlibjs';
import { ethers } from 'hardhat';

import { ZKCertificate } from '../../lib/zkCertificate';
import { getEddsaKeyFromEthSigner } from '../../lib/keyManagement';

describe('Ownership Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/ownership.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('ownership');
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
    assert.propertyVal(witness, 'main.Ax', sampleInput.Ax);
    // check resulting output
    assert.propertyVal(witness, 'main.valid', '1');
  });

  it('has verified the signature successfully', async () => {
    const expected = { valid: 1 };
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.assertOut(witness, expected);
  });

  it('identifies invalid signatures correctly', async () => {
    const fieldsToChange = ['Ax', 'Ay', 'R8x', 'R8y', 'S', 'holderCommitment'];
    for (let field of fieldsToChange) {
      let forgedInput = { ...sampleInput };
      forgedInput[field] += 1;
      await expect(
        circuit.calculateLabeledWitness(forgedInput, sanityCheck)
      ).to.be.rejectedWith('Error: Assert Failed.');
    }
  });

  it('can validate ownership commitments generated in our front-end', async () => {
    const eddsa = await buildEddsa();
    const holder = (await ethers.getSigners())[5];

    const holderEdDSAKey = await getEddsaKeyFromEthSigner(holder);
    let zkKYC = new ZKCertificate(holderEdDSAKey, eddsa.poseidon, eddsa);
    const ownershipProof = zkKYC.getOwnershipProofInput(holderEdDSAKey);

    const expected = { valid: 1 };
    const witness = await circuit.calculateWitness(ownershipProof, sanityCheck);
    await circuit.assertOut(witness, expected);
  });

  it.skip('TODO: test integration in zkKYC', async () => {});
});
