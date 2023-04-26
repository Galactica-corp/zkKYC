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
export declare function deploySC(name: string, verify?: boolean, signerOrOptions?: Signer | FactoryOptions | undefined, constructorArgs?: any[] | undefined): Promise<Contract>;
