import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildEddsa } from "circomlibjs";
import { ethers } from "hardhat";

import { getEddsaKeyFromEthSigner } from "../../lib/keyManagement";

describe.only('Private to public key derivation', () => {
  let circuit: CircuitTestUtils;
  let eddsa: any;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/privToPubKey.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('privToPubKey');
    eddsa = await buildEddsa();
  });

  it('produces a witness with valid constraints', async () => {
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.checkConstraints(witness);
  });

  it('computes expected pubKey', async () => {
    const [ alice ] = await ethers.getSigners();

    const privKey = await getEddsaKeyFromEthSigner(alice);    
    const pubKey = eddsa.prv2pub(privKey);

    // const privKey = formatPrivKeyForBabyJub(sampleInput.private_key, eddsa).toString()
    const witness = await circuit.calculateLabeledWitness(
      {"private_key": privKey.toString()},
      sanityCheck
    );
    console.log('privKey', privKey);
    console.log('privKeyTS', eddsa.F.toObject(privKey.toString()));
    console.log('privKeyTS', eddsa.F.toObject(privKey.toString()).toString());

    assert.propertyVal(witness, 'main.private_key', privKey.toString());

    // const expectedPubKey = eddsa.prv2pub(Buffer.from((BigInt(privKey)).toString(16), 'hex'));
    console.log('expectedPubKey', pubKey);
    console.log('w', witness['main.public_key[0]']);
    // check resulting output
    assert.propertyVal(witness, 'main.public_key[0]', eddsa.F.toObject(pubKey[0]));
  });

  // it('has verified the signature successfully', async () => {
  //   const expected = { valid: 1 };
  //   const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
  //   await circuit.assertOut(witness, expected);
  // });

  // it('identifies invalid signatures correctly', async () => {
  //   const fieldsToChange = ['Ax', 'Ay', 'R8x', 'R8y', 'S', 'holderCommitment'];
  //   for (let field of fieldsToChange) {
  //     let forgedInput = sampleInput;
  //     forgedInput[field] += 1;
  //     await expect(circuit.calculateLabeledWitness(forgedInput, sanityCheck))
  //       .to.be.rejectedWith("Error: Assert Failed.");
  //   }
  // });

  // it.skip('TODO: test integration in zkKYC', async () => {});
});
