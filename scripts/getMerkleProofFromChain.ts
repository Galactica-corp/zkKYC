import { buildPoseidon } from "circomlibjs";
import { MerkleTree } from "../lib/merkleTree";
import { ethers } from 'hardhat';
import { queryOnChainLeaves } from "../lib/queryMerkleTree";


/**
 * @description Script for creating a merkle tree for testing from a list of UTXOs, benchmark version
 */
async function main() {
    const registryAddress = "0x8b7f9322F2CF92908eDB02a76DD8A2cAd6E566B5";
    const leavesToProve = [
        "19630604862894493237865119507631642105595355222686969752403793856928034143008",
    ];

    // Create a new poseidon instance for hashing
    const poseidon = await buildPoseidon();

    // input
    const merkleDepth = 32;

    // build merkle tree
    const merkleTree = new MerkleTree(merkleDepth, poseidon);
    const leaves = await queryOnChainLeaves(ethers, registryAddress);
    const batchSize = 10_000;
    for (let i = 0; i < leaves.length; i += batchSize){
        merkleTree.insertLeaves(leaves.slice(i, i+batchSize));
    }

    console.log(`Merkle leaves: ${merkleTree.tree[0]}`)

    // create Merkle proofs
    for (let leaf of leavesToProve) {
        const merkleProof = merkleTree.createProof(leaf);

        let output = {
            leaf: leaf,
            root: merkleTree.root,
            pathIndices: merkleProof.pathIndices,
            pathElements: merkleProof.pathElements,
        }

        console.log(`Merkle proof for ${leaf}:\n`, JSON.stringify(output, null, 2));
    }
}
  
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});