/**
 * @description Class for managing and constructing merkle trees.
 */
export declare class MerkleTree {
    depth: number;
    private poseidon;
    F: any;
    emptyLeaf: string;
    emptyBranchLevels: string[];
    tree: string[][];
    /**
     * @description Create a MerkleTree
     *
     * @param depth Depth of the tree
     * @param poseidon Poseidon instance to use for hashing
     */
    constructor(depth: number, poseidon: any);
    /**
     * @description Calculate hash of a node from its left and right children
     *
     * @param left Left child of the node
     * @param right Right child of the node
     * @returns Hash of the node
    */
    calculateNodeHash(left: string, right: string): string;
    /**
     * Calculate node hashes for empty branches of all depths
     *
     * @param depth Max depth to calculate
     * @return Array of hashes for empty brancheswith [0] being an empty leaf and [depth] being the root
     */
    calculateEmptyBranchHashes(depth: number): string[];
    /**
     * @description Insert leaves into the tree and rebuilds the tree hashes up to the root.
     *  A more efficient way would be inserting individual leaves
     *  and updating hashes along the path to the root. This is not necessary for the curret use case
     *  because inserting new leaves into an existing tree is done in the smart contract.
     *  Here in the frontend or backend you want to build a new tree from scratch.
     *
     * @param leaves Array of leaf hashes to insert
     */
    insertleaves(leaves: string[]): void;
    get root(): string;
    /**
     * @description Create a merkle proof for a leaf
     *
     * @param leaf Hash of the leaf to prove
     * @returns Merkle proof for the leaf
     */
    createProof(leaf: string): MerkleProof;
}
/**
 * Simple struct for a merkle proof
 */
export interface MerkleProof {
    leaf: string;
    path: string[];
    pathIndices: number;
    root: string;
}
