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
npx hardhat circom --verbose
```