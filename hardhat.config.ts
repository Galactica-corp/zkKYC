import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-circom';

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  circom: {
    // Base path for input files
    inputBasePath: './circuits',
    // Base path for files being output, defaults to `./circuits/`
    outputBasePath: './circuits/build',
    // The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
    ptau: 'pot12_final.ptau',
    // Each object in this array refers to a separate circuit
    circuits: [
      {
        // The name of the main circuit file
        name: 'dark_pool',
        // Input path for witness input file, inferred from `name` if unspecified
        input: 'input.json',
      },
    ],
  },
};

export default config;
