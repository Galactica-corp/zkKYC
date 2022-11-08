import { ethers } from 'hardhat';
import chai, { use } from 'chai';
import { solidity } from 'ethereum-waffle';

chai.config.includeStack = true;

import { MockKYCRegistry } from '../typechain/MockKYCRegistry';
import { ZkKYC } from '../typechain/ZkKYC';
import { ZkKYCVerifier } from '../typechain/ZkKYCVerifier';

import { BigNumber, ContractTransaction, providers, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const snarkjs = require('snarkjs');
import { readFileSync } from 'fs';
const hre = require('hardhat');

chai.use(solidity);
const { expect } = chai;

describe.only('zkKYC', () => {
  let zkKYC: ZkKYC;
  let zkKYCVerifier: ZkKYCVerifier;
  let mockKYCRegistry: MockKYCRegistry;

  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let sampleInput, circuitWasmPath, circuitZkeyPath;

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
    )) as ZkKYCVerifier;

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

  it.only('correct proof can be verified onchain', async () => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );
    /* console.log(proof);
    console.log(publicSignals); */

    const publicRoot = publicSignals[1];
    const pulicTime = BigNumber.from(publicSignals[2]);
    // set the merkle root to the correct one
    let utf8Encode = new TextEncoder();
    const _publicRoot = utf8Encode.encode(publicRoot);

    await mockKYCRegistry.setMerkleRoot(_publicRoot);
    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [pulicTime]);
    const a = [BigNumber.from(proof.pi_a[0]), BigNumber.from(proof.pi_a[1])];
    const b = [
      [BigNumber.from(proof.pi_b[0][0]), BigNumber.from(proof.pi_b[0][1])],
      [BigNumber.from(proof.pi_b[1][0]), BigNumber.from(proof.pi_b[1][1])],
    ];
    const c = [BigNumber.from(proof.pi_c[0]), BigNumber.from(proof.pi_c[1])];
    const publicInputs = publicSignals.map((x) => BigNumber.from(x));

    console.log(a);
    console.log(publicInputs);
    await zkKYC.verifyProof(a, b, c, publicInputs);
  });
});
