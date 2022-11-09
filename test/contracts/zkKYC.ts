import { ethers } from 'hardhat';
import chai, { use } from 'chai';
import { solidity } from 'ethereum-waffle';

chai.config.includeStack = true;

import { MockKYCRegistry } from '../../typechain-types/mock/MockKYCRegistry';
import { ZkKYC } from '../../typechain-types/ZkKYC';
import { ZkKYCVerifier } from '../../typechain-types/ZkKYCVerifier';

import { BigNumber, ContractTransaction, providers, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const snarkjs = require('snarkjs');
import { readFileSync } from 'fs';
const hre = require('hardhat');
import { fromDecToHex } from '../../lib/helpers';
const fs = require('fs');

chai.use(solidity);
const { expect } = chai;

describe.only('zkKYC SC', () => {
  let zkKYC: ZkKYC;
  let zkKYCVerifier: ZkKYCVerifier;
  let mockKYCRegistry: MockKYCRegistry;

  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let sampleInput: any, circuitWasmPath: string, circuitZkeyPath: string;

  // this function convert the proof output from snarkjs to parameter format for onchain solidity verifier
  function processProof(proof: any) {
    const a = proof.pi_a.slice(0, 2).map((x) => fromDecToHex(x, true));
    const b = [
      [proof.pi_b[0][1], proof.pi_b[0][0]].map((x) => fromDecToHex(x, true)),
      [proof.pi_b[1][1], proof.pi_b[1][0]].map((x) => fromDecToHex(x, true)),
    ];

    const c = proof.pi_c.slice(0, 2).map((x) => fromDecToHex(x, true));
    return [a, b, c];
  }

  function processPublicSignals(publicSignals: any) {
    return publicSignals.map((x) => fromDecToHex(x, true));
  }

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    // set up KYCRegistry, ZkKYCVerifier, ZkKYC
    const mockKYCRegistryFactory = await ethers.getContractFactory(
      'MockKYCRegistry',
      deployer
    );
    mockKYCRegistry =
      (await mockKYCRegistryFactory.deploy()) as MockKYCRegistry;

    const zkKYCVerifierFactory = await ethers.getContractFactory(
      'ZkKYCVerifier',
      deployer
    );
    zkKYCVerifier = (await zkKYCVerifierFactory.deploy()) as ZkKYCVerifier;

    const zkKYCFactory = await ethers.getContractFactory('ZkKYC', deployer);
    zkKYC = (await zkKYCFactory.deploy(
      deployer.address,
      zkKYCVerifier.address,
      mockKYCRegistry.address
    )) as ZkKYC;

    // inputs to create proof
    sampleInput = JSON.parse(
      readFileSync('./circuits/input/zkKYC.json', 'utf8')
    );
    circuitWasmPath = './circuits/build/zkKYC.wasm';
    circuitZkeyPath = './circuits/build/zkKYC.zkey';
  });

  it('only owner can change KYCRegistry and Verifier addresses', async () => {
    // random user cannot change the addresses
    await expect(
      zkKYC.connect(user).setVerifier(user.address)
    ).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(
      zkKYC.connect(user).setKYCRegistry(user.address)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    //owner can change addresses
    await zkKYC.connect(deployer).setVerifier(user.address);
    await zkKYC.connect(deployer).setKYCRegistry(user.address);

    expect(await zkKYC.verifier()).to.be.equal(user.address);
    expect(await zkKYC.KYCRegistry()).to.be.equal(user.address);
  });

  it('correct proof can be verified onchain', async () => {
    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[1];
    const pulicTime = parseInt(publicSignals[2], 10);
    // set the merkle root to the correct one

    await mockKYCRegistry.setMerkleRoot(
      Buffer.from(fromDecToHex(publicRoot), 'hex')
    );
    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [pulicTime]);
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await zkKYC.verifyProof(a, b, c, publicInputs);
  });

  it('incorrect proof failed to be verified', async () => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[1];
    // set the merkle root to the correct one

    await mockKYCRegistry.setMerkleRoot(
      Buffer.from(fromDecToHex(publicRoot), 'hex')
    );
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);

    // switch c, a to get an incorrect proof
    // it doesn't fail on time because the time change remains from the previous test
    await expect(zkKYC.verifyProof(c, b, a, publicInputs)).to.be.reverted;
  });

  it('correct proof can be verified onchain', async () => {
    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[1];
    const pulicTime = parseInt(publicSignals[2], 10);
    // set the merkle root to the correct one

    await mockKYCRegistry.setMerkleRoot(
      Buffer.from(fromDecToHex(publicRoot), 'hex')
    );
    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [pulicTime]);
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await zkKYC.verifyProof(a, b, c, publicInputs);
  });
});
