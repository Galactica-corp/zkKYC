import { ethers } from "hardhat";

async function main() {

    const [deployer] = await hre.ethers.getSigners();

    console.log(`Deploying contracts with account ${deployer.address} on network ${hre.network.name}`);

    console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);

  const UserEncryptedDataFactory = await ethers.getContractFactory("UserEncryptedData");
  const UserEncryptedDataInstance = await UserEncryptedDataFactory.deploy();


  console.log(`The address of the contract is ${UserEncryptedDataInstance.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
