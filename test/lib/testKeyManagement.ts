import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildEddsa } from "circomlibjs";
import { ethers } from "hardhat";

import { getEddsaKeyFromEthSigner, eddsaKeyGenerationMessage, generateEcdhSharedKey } from "../../lib/keyManagement";

describe('Key Management', () => {
  let babyjub, eddsa: any;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/ownership.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    eddsa = await buildEddsa();
    babyjub = await eddsa.babyJub;
  });

  it('can generate EdDSA key from signature', async () => {
    const holder = (await ethers.getSigners())[6];

    const holderEdDSAKey = await getEddsaKeyFromEthSigner(holder);
    
    expect(ethers.utils.recoverAddress(ethers.utils.hashMessage(eddsaKeyGenerationMessage), holderEdDSAKey))
      .to.equal(holder.address);
  });

  it('generates unique shared ECDH key for alice and bob', async () => {
    const [ alice, bob, charlie ] = await ethers.getSigners();

    const alicePriv = await getEddsaKeyFromEthSigner(alice);
    const bobPriv = await getEddsaKeyFromEthSigner(bob);
    const charliePriv = await getEddsaKeyFromEthSigner(charlie);
    
    const alicePub = eddsa.prv2pub(alicePriv);
    const bobPub = eddsa.prv2pub(bobPriv);
    const charliePub = eddsa.prv2pub(charliePriv);

    // same key for alice and bob
    const sharedKeyAB = generateEcdhSharedKey(alicePriv, bobPub, eddsa);
    const sharedKeyBA = generateEcdhSharedKey(bobPriv, alicePub, eddsa);
    for(let i in [0, 1]){
      expect(sharedKeyAB[i]).to.equal(sharedKeyBA[i]);
    }

    // different keys for different participants
    const sharedKeyAC = generateEcdhSharedKey(alicePriv, charliePub, eddsa);
    for(let i in [0, 1]){
      expect(sharedKeyAB[i]).to.not.equal(sharedKeyAC[i]);
    }
  });
});
