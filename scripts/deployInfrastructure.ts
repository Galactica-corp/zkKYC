import hre from "hardhat";
import { ethers, run } from "hardhat";
import { overwriteArtifact } from "../lib/helpers";
import { poseidonContract } from 'circomlibjs';
import { Contract, Signer } from "ethers";
import { FactoryOptions } from "hardhat/types";


async function deploySC(name: string, verify?: boolean, signerOrOptions?: Signer | FactoryOptions | undefined, constructorArgs?: any[] | undefined) : Promise<Contract> {
  console.log(`Deploying ${name}...`);
  const factory = await ethers.getContractFactory(name, signerOrOptions);
  
  let contract: Contract;
  if (constructorArgs === undefined) {
    contract = await factory.deploy();
  }
  else {
    contract = await factory.deploy(...constructorArgs);
  }
  await contract.deployed();

  console.log(`${name} deployed to ${contract.address}`);

  if (verify) {
    try {
      // verify contract
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: constructorArgs,
        ...signerOrOptions
      });
    } catch (error: any) {
      console.log(`Verification failed: ${error.message}`)
      console.log(`If you get a file not found error, try running 'npx hardhat clean' first`)
    }
  }

  console.log();

  return contract;
}

async function main() {
  // parameters

  // wallets
  const [ deployer ] = await hre.ethers.getSigners();
  console.log(`Using account ${deployer.address} to deploy contracts`);
  console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);

  // deploying everything
  await overwriteArtifact(hre, 'PoseidonT3', poseidonContract.createCode(2));
  
  const poseidonT3 = await deploySC('PoseidonT3', false);
  const centerRegistry = await deploySC('KYCCenterRegistry', true);
  const recordRegistry = await deploySC(
    'KYCRecordRegistryTest',
    true,
    {
      libraries: {
        PoseidonT3: poseidonT3.address,
      },
    },
    [poseidonT3.address]
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
