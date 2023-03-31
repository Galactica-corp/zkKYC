# zkKYC
circom circuits and test for private KYC on EVM-compatible chains

The project is based on:
- harhat for Solidity development
- Circom for the zero knowledge part to write SNARK circuits
- SnarkJS for creating zk proofs

## Install
```shell
npm install
```

## Compile
Compile the SNARK circuit and build the verifyer.sol contract
Before you can set test input variables in `circuits/init.json`.
```shell
npx hardhat smartCircuitBuild --verbose
```
This only rebuilds the circuits for which the source changed since the last build.

If the circuits were changed, the compilation requires a valid input file for the circuit. They can be found in `circuits/input/`. They can be modified by hand. For complex circuits using hashes, such as zkKYC, you can use the `npx hardhat run scripts/writeExampleZKKYCInputs.ts` to generate the file inlcuding hashes and merkle tree data.

To compile the library functions into a node module, you can run:
```shell
npm run build
```

## Test
Run unit and integration tests for circuits, library functions and smart contracts.
```shell
npx hardhat smartCircuitBuild --verbose
npm run test
```

## Deploy
There are some scripts for deployment of the basic infrastructure and example dApps.
Before running it, you need to configure the deployer wallet in the environment variables used in `hardhat.config.ts` adn fund the account.
```shell
npx hardhat run scripts/deployInfrastructure.ts --network galaTestnet
```
You can find the addresses of the deployed contracts in the console output.
If you also want to deploy example contracts, you can enter them in the following script before running it.
```shell
npx hardhat run scripts/deployExampleDApp.ts --network galaTestnet
```