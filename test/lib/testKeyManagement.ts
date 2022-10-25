import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildEddsa } from "circomlibjs";
import { ethers } from "hardhat";

import { getEddsaKeyFromEthSigner, eddsaKeyGenerationMessage } from "../../lib/keyManagement";

describe.only('Key Management', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/ownership.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('ownership');
  });

  it('can generate EdDSA key from signature', async () => {
    const eddsa = await buildEddsa();
    const holder = (await ethers.getSigners())[6];

    const holderEdDSAKey = await getEddsaKeyFromEthSigner(holder);
    
    expect(ethers.utils.recoverAddress(ethers.utils.hashMessage(eddsaKeyGenerationMessage), holderEdDSAKey))
      .to.equal(holder.address);
  });

  it('can generate EdDSA key from signature', async () => {
    const eddsa = await buildEddsa();
    const holder = (await ethers.getSigners())[6];

    const holderEdDSAKey = await getEddsaKeyFromEthSigner(holder);
    
    expect(ethers.utils.recoverAddress(ethers.utils.hashMessage(eddsaKeyGenerationMessage), holderEdDSAKey))
      .to.equal(holder.address);
  });
});
