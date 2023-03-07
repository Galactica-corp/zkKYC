import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildEddsa } from 'circomlibjs';
import { ethers } from 'hardhat';

import { ZKCertificate } from '../../lib/zkCertificate';
import {
  createHolderCommitment,
  getEddsaKeyFromEthSigner,
} from '../../lib/keyManagement';
import { ZkCertStandard } from '../../lib';

describe('Authorization Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/authorization.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('authorization');
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
  });

  it('has verified the signature successfully', async () => {
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
  });

  it('identifies invalid signatures correctly', async () => {
    const fieldsToChange = ['Ax', 'Ay', 'R8x', 'R8y', 'S', 'userAddress'];
    for (let field of fieldsToChange) {
      let forgedInput = { ...sampleInput };
      forgedInput[field] += 1;
      await expect(
        circuit.calculateLabeledWitness(forgedInput, sanityCheck)
      ).to.be.rejectedWith('Error: Assert Failed.');
    }
  });

  it('can validate authorization generated in our front-end', async () => {
    const eddsa = await buildEddsa();
    const holder = (await ethers.getSigners())[5];

    const holderEdDSAKey = await getEddsaKeyFromEthSigner(holder);
    const holderCommitment = await createHolderCommitment(
      eddsa,
      holderEdDSAKey
    );
    const userAddress = sampleInput.userAddress;
    let zkKYC = new ZKCertificate(
      holderCommitment,
      ZkCertStandard.zkKYC,
      eddsa,
      0
    );
    const authorizationProof = zkKYC.getAuthorizationProofInput(
      holderEdDSAKey,
      userAddress
    );

    await circuit.calculateWitness(authorizationProof, sanityCheck);
  });

  it.skip('TODO: test integration in zkKYC', async () => {});
});
