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
    const leavesToProof = [
        '3117336777051834855540872560265552874773137464163281414505601608025080702835',
        '11690962910717114621585926656367784137101499736064175664387577423028391106711',
    ];
    const leaves : string[] = leavesToProof;

    // calculate merkle tree
    const merkleTree = new MerkleTree(merkleDepth, poseidon);
    merkleTree.insertleaves(leaves);

    leavesToProof.forEach(leaf => {
        const merkleProof = merkleTree.createProof(leaf);

        // create json output file
        let output = {
            root: merkleTree.root,
            pathIndices: merkleProof.pathIndices,
            pathElements: merkleProof.path,
        }

        console.log(`Merkle proof for ${leaf}:`, output);
    });
}
  
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});