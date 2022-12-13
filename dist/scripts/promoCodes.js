"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
/**
 * @description Script for creating a promocodes
 * @dev Just modify the prefix to get different codes. It should be long enough so avoid brute force attacks
 */
async function main() {
    const basePrefix = "PutPrefixHere_";
    const amount = 1000;
    const length = 20;
    for (let i = 0; i < amount; i++) {
        const base = basePrefix + i.toString();
        const hash = hardhat_1.ethers.utils.keccak256(hardhat_1.ethers.utils.toUtf8Bytes(base));
        const promoCode = hash.toUpperCase().slice(2, 2 + length);
        // to prevent frontrunning, we need to do a bit more than putting the verification code on chain.
        // Options are using a zk proof including the recipients address or redeeming the code off chain.
        // const verificationHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(promoCode));
        console.log(`${base}\t${promoCode}`);
    }
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
