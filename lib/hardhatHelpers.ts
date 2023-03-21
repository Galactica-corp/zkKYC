import { ethers, run } from "hardhat";
import { Contract, Signer } from "ethers";
import { FactoryOptions } from "hardhat/types";
import chalk from "chalk";

/**
 * Helper function to deploy a smart contract and verify it on the block explorer
 * 
 * @param name Name of the smart contract
 * @param verify Whether to verify the contract on the block explorer
 * @param signerOrOptions signer or options as taken by hardhat
 * @param constructorArgs Constructor arguments as array or undefined when empty
 * @returns Promise of the deployed contract
 */
export async function deploySC(name: string, verify?: boolean, signerOrOptions?: Signer | FactoryOptions | undefined, constructorArgs?: any[] | undefined): Promise<Contract> {
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

  console.log(chalk.green(`${name} deployed to ${contract.address}`));

  
  if (verify) {
    try {
      // in case there are multiple contracts with the same bytecode (e.g. tokens), we need to pass the fully qualified name to the verifier
      let contractArgs = {};
      if (name.includes('.sol:')) {
        contractArgs = { contract: name };
      }
      
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: constructorArgs,
        ...contractArgs,
        ...signerOrOptions
      });
    } catch (error: any) {
      console.error(chalk.red(`Verification failed: ${error.message}`));
      console.error(chalk.red(`If you get a file not found error, try running 'npx hardhat clean' first`));
    }
  }
  return contract;
}
