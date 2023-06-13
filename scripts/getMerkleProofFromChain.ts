import { buildPoseidon } from "circomlibjs";
import { MerkleTree } from "../lib/merkleTree";
import { ethers } from 'hardhat';
import { KYCRecordRegistry } from '../typechain-types/contracts/KYCRecordRegistry';
import { Provider } from "@ethersproject/abstract-provider";


/**
 * @description Script for creating a merkle tree for testing from a list of UTXOs, benchmark version
 */
async function main() {
    const registryAddress = "0x9dC3856A0D3e2d008B6F7A97594A5AD77383FA72";
    const poseidonAddress = "0xEbC2735c9989A9c4C6783608eB1a9b9e0fbbac4d";
    const leavesToProve = [
        "19630604862894493237865119507631642105595355222686969752403793856928034143008",
    ];

    // Create a new poseidon instance for hashing
    const poseidon = await buildPoseidon();

    // input
    const merkleDepth = 32;

    const leaves = await queryOnChainLeaves(ethers.provider, registryAddress, poseidonAddress);

    // build merkle tree
    const merkleTree = new MerkleTree(merkleDepth, poseidon);
    const batchSize = 10_000;
    for (let i = 0; i < leaves.length; i += batchSize){
        merkleTree.insertLeaves(leaves.slice(i, i+batchSize));
    }

    console.log(`Merkle leaves: ${merkleTree.tree[0]}`)

    // create Merkle proofs
    for (let leaf of leavesToProve) {
        const merkleProof = merkleTree.createProof(leaf);

        let output = {
            root: merkleTree.root,
            pathIndices: merkleProof.pathIndices,
            pathElements: merkleProof.pathElements,
        }

        console.log(`Merkle proof for ${leaf}:\n`, JSON.stringify(output, null, 2));
    }

}

async function queryOnChainLeaves(provider: Provider, contractAddr: string, poseidonAddr: string, firstBlock: number = 1): Promise<string[]> {
    const factory = await ethers.getContractFactory("KYCRecordRegistry", {
        libraries: {
            PoseidonT3: poseidonAddr,
        },
    });
    const contract = factory.attach(contractAddr) as KYCRecordRegistry;

    const currentBlock = await provider.getBlockNumber();
    let res : string[] = [];

    const maxBlockInterval = 10000;
    console.log(`Getting Merkle tree leaves by reading blockchain log from ${firstBlock} to ${currentBlock}`);

    // get logs in batches of 10000 blocks because of rpc call size limit
    for (let i = firstBlock; i < currentBlock; i += maxBlockInterval) {
        const maxBlock = Math.min(i + maxBlockInterval, currentBlock);
        // display progress in %
        printProgress(`${Math.round(((maxBlock-firstBlock) / (currentBlock-firstBlock)) * 100)}`);
    
        // go through all logs adding a verification SBT for the user
        const createStakeLogs = await contract.queryFilter(contract.filters.zkKYCRecordAddition(), i, maxBlock);

        for (let log of createStakeLogs) {
            const leafHex = log.args[0];
            const leafDecimalString = BigInt(leafHex).toString();
            res.push(leafDecimalString);
        }
    }
    printProgress(`100`);
    console.log(``);
    return res;
}

function printProgress(progress: string) {
    process.stdout.clearLine(-1);
    process.stdout.cursorTo(0);
    process.stdout.write(progress + '%');
}
  
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});