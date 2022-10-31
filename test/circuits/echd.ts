import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildEddsa } from "circomlibjs";
import { ethers } from "hardhat";

import { getEddsaKeyFromEthSigner, generateEcdhSharedKey, formatPrivKeyForBabyJub } from "../../lib/keyManagement";

describe('ECDH shared key derivation', () => {
  let circuit: CircuitTestUtils;
  let eddsa: any;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/ecdh.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('ecdh');
    eddsa = await buildEddsa();
  });

  it('produces a witness with valid constraints', async () => {
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.checkConstraints(witness);
  });

  it('generates unique shared ECDH key for alice and bob', async () => {
    const [ alice, bob ] = await ethers.getSigners();

    const alicePriv = BigInt(await getEddsaKeyFromEthSigner(alice)).toString();
    const bobPriv = BigInt(await getEddsaKeyFromEthSigner(bob)).toString();
    
    const alicePub = eddsa.prv2pub(alicePriv);
    const bobPub = eddsa.prv2pub(bobPriv);

    // same key for alice and bob
    const sharedKeyAB = generateEcdhSharedKey(alicePriv, bobPub, eddsa);
    const sharedKeyBA = generateEcdhSharedKey(bobPriv, alicePub, eddsa);
    for(let i in [0, 1]){
      expect(sharedKeyAB[i]).to.equal(sharedKeyBA[i]);
    }

    const witness = await circuit.calculateLabeledWitness(
      {
        "privKey": formatPrivKeyForBabyJub(alicePriv, eddsa),
        "pubKey": bobPub.map((p: any) => eddsa.poseidon.F.toObject(p).toString())
      },
      sanityCheck
    );
    
    for(let i in [0, 1]){
      assert.propertyVal(witness, `main.sharedKey[${i}]`, sharedKeyAB[i]);
    }
  });
});
