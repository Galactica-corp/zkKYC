import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-circom';

const config: HardhatUserConfig = {
  mocha: {
    timeout: 100000000,
  },
  solidity: {
    compilers: [
      {
        version: '0.6.11', // for Verifier created by hardhat-circom
      },
      {
        version: '0.8.17',
      },
    ],
  },
  circom: {
    // Base path for input files
    inputBasePath: './circuits',
    // Base path for files being output, defaults to `./circuits/`
    outputBasePath: './circuits/build',
    // The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
    ptau: 'pot15_final.ptau',
    // Each object in this array refers to a separate circuit
    circuits: [
      /* {
        // The name of the main circuit file
        name: 'zkKYC',
        // Input path for witness input file, inferred from `name` if unspecified
        input: 'input.json',
        }, */
      {
        name: 'merkleProof',
        circuit: 'test/test_merkleProof.circom',
        input: 'input/merkleProof.json',
      },
      {
        name: 'merkleProof2',
        circuit: 'test/test_merkleProof_2.circom',
        input: 'input/merkleProof_2.json',
      },
      {
        name: 'calculateZkCertHash',
        circuit: 'test/test_calculateZkCertHash.circom',
        input: 'input/calculateZkCertHash.json',
      },
      {
        name: 'zkKYC',
        circuit: 'test/test_zkKYC.circom',
        input: 'input/zkKYC.json',
      },
      {
        name: 'humanID',
        circuit: 'test/test_humanID.circom',
        input: 'input/humanID.json',
      },
      {
        name: 'ownership',
        circuit: 'test/test_ownership.circom',
        input: 'input/ownership.json',
      },
    ],
  },
};

export default config;
