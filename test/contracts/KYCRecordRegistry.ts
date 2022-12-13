import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { buildEddsa } from 'circomlibjs';

import { MerkleTree } from '../../lib/merkleTree';
import { overwriteArtifact, fromDecToHex, fromHexToBytes32, generateRandomBytes32Array, arrayToBigInt } from '../../lib/helpers';
import { poseidonContract } from 'circomlibjs';


describe('KYCRecordRegistry', () => {
  /**
   * Deploy fixtures
   *
   * @returns fixtures
   */
  async function deploy() {
    await overwriteArtifact(
        hre,
        'PoseidonT3',
        poseidonContract.createCode(2),
    );

    const PoseidonT3 = await ethers.getContractFactory('PoseidonT3');
    const poseidonT3 = await PoseidonT3.deploy();

    const KYCRecordRegistryTest = await ethers.getContractFactory('KYCRecordRegistryTest', {
      libraries: {
        PoseidonT3: poseidonT3.address,
      },
    });
    const KYCRecordRegistry = await KYCRecordRegistryTest.deploy();

    return {
      KYCRecordRegistry,
    };
  }

  it("Shouldn't initialize twice", async () => {
    const { KYCRecordRegistry } = await loadFixture(deploy);

    await expect(KYCRecordRegistry.doubleInit()).to.be.revertedWith(
      'Initializable: contract is not initializing',
    );
  });

  it('Should calculate zero values', async () => {
    const { KYCRecordRegistry } = await loadFixture(deploy);

    const eddsa = await buildEddsa();
    const treeDepth = 32;
    const merkleTree = new MerkleTree(treeDepth, eddsa.poseidon);

    // Each value in the zero values array should be the same
    for (let i = 0; i < treeDepth; i++) {
        expect(await KYCRecordRegistry.zeros(i)).to.equal(fromHexToBytes32(fromDecToHex(merkleTree.emptyBranchLevels[i])));
    }

  });

  it('Should calculate empty root', async () => {
    const { KYCRecordRegistry } = await loadFixture(deploy);

    const eddsa = await buildEddsa();
    const treeDepth = 32;
    const merkleTree = new MerkleTree(treeDepth, eddsa.poseidon);

    // Should initialize empty root correctly
    expect(await KYCRecordRegistry.merkleRoot()).to.equal(fromHexToBytes32(fromDecToHex(merkleTree.root)));
  });


  it('Should incrementally insert elements', async function () {
    let loops = 5;


    const { KYCRecordRegistry } = await loadFixture(deploy);

    const eddsa = await buildEddsa();
    const treeDepth = 32;
    const merkleTree = new MerkleTree(treeDepth, eddsa.poseidon);

    const insertList = [];
    for (let i = 0; i < loops; i += 1) {
      // Check the insertion numbers
      expect(
        await KYCRecordRegistry.getInsertionTreeNumberAndStartingIndex(insertList.length),
      ).to.deep.equal([0, merkleTree.tree[0].length]);

      // Update with insert list on local and contract
      await KYCRecordRegistry.insertLeavesTest(insertList);
      merkleTree.insertleaves(insertList);

      // Check roots match
      expect(await KYCRecordRegistry.merkleRoot()).to.equal(fromHexToBytes32(fromDecToHex(merkleTree.root)));

      // Check tree length matches
      expect(await KYCRecordRegistry.nextLeafIndex()).to.equal(merkleTree.tree[0].length);

      // Add another element to insert list
      insertList.push(fromHexToBytes32(arrayToBigInt(generateRandomBytes32Array(1)[0]).toString(16)));
    }
  });

  it('Should roll over to new tree', async function () {
    const { KYCRecordRegistry } = await loadFixture(deploy);

    // Check tree number is 0
    expect(await KYCRecordRegistry.treeNumber()).to.equal(0);

    // Set next leaf index to one less than filled tree
    const treeDepth = 32;
    await KYCRecordRegistry.setNextLeafIndex(2 ** treeDepth - 2);

    // Check the insertion numbers
    expect(await KYCRecordRegistry.getInsertionTreeNumberAndStartingIndex(1)).to.deep.equal([
      0,
      2 ** treeDepth - 2,
    ]);

    // Insert leaf hash
    await KYCRecordRegistry.insertLeavesTest(generateRandomBytes32Array(1));

    // Check the insertion numbers
    expect(await KYCRecordRegistry.getInsertionTreeNumberAndStartingIndex(1)).to.deep.equal([
      0,
      2 ** treeDepth - 1,
    ]);

    // Check tree number is 0
    expect(await KYCRecordRegistry.treeNumber()).to.equal(0);

    // Insert leaf hash
    await KYCRecordRegistry.insertLeavesTest(generateRandomBytes32Array(1));

    // Check the insertion numbers
    expect(await KYCRecordRegistry.getInsertionTreeNumberAndStartingIndex(1)).to.deep.equal([1, 0]);

    // Insert leaf hash
    await KYCRecordRegistry.insertLeavesTest(generateRandomBytes32Array(1));

    // Check tree number is 1
    expect(await KYCRecordRegistry.treeNumber()).to.equal(1);
  });
});