import { ethers } from "hardhat";


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
        const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(base));
        const promoCode = hash.toUpperCase().slice(2, 2 + length);
        const verificationHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(promoCode));
        console.log(`${base}\t${promoCode}\t${verificationHash}`);
    }
}
  
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});