"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const circomlibjs_1 = require("circomlibjs");
const merkleTree_1 = require("../lib/merkleTree");
/**
 * @description Script for creating a merkle tree for testing from a list of UTXOs
 */
async function main() {
    // Create a new poseidon instance for hashing
    const poseidon = await (0, circomlibjs_1.buildPoseidon)();
    // input
    const merkleDepth = 32;
    const leaves = [
        "19630604862894493237865119507631642105595355222686969752403793856928034143008",
        "913338630289763938167212770624253461411251029088142596559861590717003723041",
    ];
    // calculate merkle tree
    const merkleTree = new merkleTree_1.MerkleTree(merkleDepth, poseidon);
    merkleTree.insertleaves(leaves);
    for (const leaf of leaves) {
        const merkleProof = merkleTree.createProof(leaf);
        // create json output file
        let output = {
            root: merkleTree.root,
            pathIndices: merkleProof.pathIndices,
            pathElements: merkleProof.path,
        };
        console.log(`Merkle proof for ${leaf}:\n`, JSON.stringify(output, null, 2));
    }
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
