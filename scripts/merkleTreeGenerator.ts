import { buildPoseidon } from "circomlibjs";
import { MerkleTree } from "../src/merkleTree";


/**
 * @description Script for creating a merkle tree for testing from a list of UTXOs
 */
async function main() {
    // Create a new poseidon instance for hashing
    const poseidon = await buildPoseidon();

    // input
    const merkleDepth = 3;  
    const leaveToProof = "15646194932191706495862906095406754101147480025603658888861721911217238705165";
    const leaves : string[] = [
        "16515646194932191706495862906095406754101147480025603658888861721911217238705",
        leaveToProof,
        "06095406754101147480025603658888861721911217238705165156461949321917064958629",
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