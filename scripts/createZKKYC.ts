import { buildEddsa } from "circomlibjs";
import { ZKCertificate } from "../lib/zkCertificate";
import { getEddsaKeyFromEthSigner } from "../lib/keyManagement";
import { ethers } from "hardhat";


/**
 * @description Script for creating a zkKYC certificate
 */
async function main() {
    // and eddsa instance for signing
    const eddsa = await buildEddsa();

    // input
    // you can change the holder to another address, the script just needs to be able to sign a message with it
    const [ holder ] = await ethers.getSigners();

    const holderEdDSAKey = await getEddsaKeyFromEthSigner(holder);
    // TODO: create ZkKYC subclass requiring all the other fields
    let zkKYC = new ZKCertificate(holderEdDSAKey, eddsa.poseidon, eddsa);

    // create json output file for ownership test  
    console.log(zkKYC.getOwnershipProofInput(holderEdDSAKey));
}
  
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});