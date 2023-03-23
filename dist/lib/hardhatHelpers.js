"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploySC = void 0;
const hardhat_1 = require("hardhat");
const chalk_1 = __importDefault(require("chalk"));
/**
 * Helper function to deploy a smart contract and verify it on the block explorer
 *
 * @param name Name of the smart contract
 * @param verify Whether to verify the contract on the block explorer
 * @param signerOrOptions signer or options as taken by hardhat
 * @param constructorArgs Constructor arguments as array or undefined when empty
 * @returns Promise of the deployed contract
 */
async function deploySC(name, verify, signerOrOptions, constructorArgs) {
    console.log(`Deploying ${name}...`);
    const factory = await hardhat_1.ethers.getContractFactory(name, signerOrOptions);
    let contract;
    if (constructorArgs === undefined) {
        contract = await factory.deploy();
    }
    else {
        contract = await factory.deploy(...constructorArgs);
    }
    await contract.deployed();
    console.log(chalk_1.default.green(`${name} deployed to ${contract.address}`));
    if (verify) {
        try {
            // in case there are multiple contracts with the same bytecode (e.g. tokens), we need to pass the fully qualified name to the verifier
            let contractArgs = {};
            if (name.includes('.sol:')) {
                contractArgs = { contract: name };
            }
            await (0, hardhat_1.run)("verify:verify", {
                address: contract.address,
                constructorArguments: constructorArgs,
                ...contractArgs,
                ...signerOrOptions
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`Verification failed: ${error.message}`));
            console.error(chalk_1.default.red(`If you get a file not found error, try running 'npx hardhat clean' first`));
        }
    }
    return contract;
}
exports.deploySC = deploySC;
