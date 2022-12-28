import { buildPoseidon } from "circomlibjs";
import { MerkleTree } from "../lib/merkleTree";


/**
 * @description Script for creating a merkle tree for testing from a list of UTXOs
 */
async function main() {
    // Create a new poseidon instance for hashing
    const poseidon = await buildPoseidon();

    // input
    const merkleDepth = 32;  
    const leaveToProof = "3117336777051834855540872560265552874773137464163281414505601608025080702835";
    const leaves : string[] = [
        leaveToProof,
    ];

    // calculate merkle tree
    const merkleTree = new MerkleTree(merkleDepth, poseidon);
    merkleTree.insertleaves(leaves);

    const merkleProof = merkleTree.createProof(leaveToProof);

    // create json output file
    let output = {
        root: merkleTree.root,
        pathIndices: merkleProof.pathIndices,
        pathElements: merkleProof.path,
    }
  
    console.log("Result:", output);
}
  
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});