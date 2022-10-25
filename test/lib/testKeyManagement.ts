import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildEddsa } from "circomlibjs";
import { ethers } from "hardhat";

import { getEddsaKeyFromEthSigner, eddsaKeyGenerationMessage, generateEcdhSharedKey } from "../../lib/keyManagement";

describe.only('Key Management', () => {
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

  it('generates the same shared ECDH key for alice and bob', async () => {
    const [ alice, bob ] = await ethers.getSigners();

    const alicePriv = await getEddsaKeyFromEthSigner(alice);
    const bobPriv = await getEddsaKeyFromEthSigner(bob);
    
    const alicePub = eddsa.prv2pub(alicePriv);
    const bobPub = eddsa.prv2pub(bobPriv);

    const sharedKeyComputedByAlice = generateEcdhSharedKey(alicePriv, bobPub, eddsa);
    const sharedKeyComputedByBob = generateEcdhSharedKey(bobPriv, alicePub, eddsa);
    console.log(sharedKeyComputedByAlice);

    expect(sharedKeyComputedByAlice).to.equal(sharedKeyComputedByAlice);
  });
});
