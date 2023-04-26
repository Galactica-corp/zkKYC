import { ethers, network } from "hardhat";

async function main() {
    let UserEncryptedDataAddress: string;

    const [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with account ${deployer.address} on network ${network.name}`);

    if (network.name == "galaTestnet") {
        UserEncryptedDataAddress = "0x6A2abBFC400aEd3f5282028FBbf08e97FC6935DA";
    }
    else {
      throw new Error("Unknown network");
    }

    let userAddress = "0x2fAA3255e51286480ADC4557eAF0B8456a250B02";

    let userEncryptedDataSC = await ethers.getContractAt("UserEncryptedData", UserEncryptedDataAddress);

    let userEncryptedData = await userEncryptedDataSC.encryptedData(userAddress);

    console.log(`Encrypted data for user ${userAddress} is ${userEncryptedData}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
