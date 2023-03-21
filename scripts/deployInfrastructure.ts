import hre from "hardhat";
import { ethers, run } from "hardhat";
import { overwriteArtifact } from "../lib/helpers";
import { poseidonContract } from 'circomlibjs';
import { Contract, Signer } from "ethers";
import { FactoryOptions } from "hardhat/types";


/**
 * Helper function to deploy a smart contract and verify it on the block explorer
 * 
 * @param name Name of the smart contract
 * @param verify Whether to verify the contract on the block explorer
 * @param signerOrOptions signer or options as taken by hardhat
 * @param constructorArgs Constructor arguments as array or undefined when empty
 * @returns Promise of the deployed contract
 */
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
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: constructorArgs,
        ...signerOrOptions
      });
    } catch (error: any) {
      console.error(`Verification failed: ${error.message}`)
      console.error(`If you get a file not found error, try running 'npx hardhat clean' first`)
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

  // get poseidon from library
  await overwriteArtifact(hre, 'PoseidonT3', poseidonContract.createCode(2));
  
  // deploying everything
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
    [centerRegistry.address]
  );
  const ageProofZkKYCVerifier = await deploySC('AgeProofZkKYCVerifier', true);
  const galacticaInstitution = await deploySC('MockGalacticaInstitution', true);
  const ageProofZkKYC = await deploySC('AgeProofZkKYC',
    true,
    {},
    [deployer.address, ageProofZkKYCVerifier.address, recordRegistry.address, galacticaInstitution.address]
  );
  const verificationSBT = await deploySC('VerificationSBT', true);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
