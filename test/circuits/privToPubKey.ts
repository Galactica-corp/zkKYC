import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildEddsa } from "circomlibjs";
import { ethers } from "hardhat";

import { getEddsaKeyFromEthSigner, formatPrivKeyForBabyJub } from "../../lib/keyManagement";

describe('Private to public key derivation', () => {
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
    const privKeyConverted = BigInt(privKey).toString();
    const privKeyField = formatPrivKeyForBabyJub(privKeyConverted, eddsa);
  
    const pubKey = eddsa.prv2pub(privKeyConverted);
  
    const witness = await circuit.calculateLabeledWitness(
      {"private_key": privKeyField},
      sanityCheck
    );

    assert.propertyVal(witness, 'main.private_key', privKeyField.toString());

    // check resulting output
    for(let i in [0, 1]){
      assert.propertyVal(witness, `main.public_key[${i}]`,
       eddsa.poseidon.F.toObject(pubKey[i]).toString());
    }
  });
});
