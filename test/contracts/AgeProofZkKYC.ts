import { ethers } from 'hardhat';
import chai, { use } from 'chai';
import { solidity } from 'ethereum-waffle';

chai.config.includeStack = true;

import { MockKYCRegistry } from '../../typechain-types/mock/MockKYCRegistry';
import { AgeProofZkKYC } from '../../typechain-types/AgeProofZkKYC';
import { AgeProofZkKYCVerifier } from '../../typechain-types/AgeProofZkKYCVerifier';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const snarkjs = require('snarkjs');
import { readFileSync } from 'fs';
const hre = require('hardhat');
import {
  fromDecToHex,
  processProof,
  processPublicSignals,
  fromHexToBytes32,
} from '../../lib/helpers';

chai.use(solidity);
const { expect } = chai;

describe.only('ageProofZkKYC SC', async () => {
  // reset the testing chain so we can perform time related tests
  /* await hre.network.provider.send('hardhat_reset'); */
  let ageProofZkKYC: AgeProofZkKYC;
  let ageProofZkKYCVerifier: AgeProofZkKYCVerifier;
  let mockKYCRegistry: MockKYCRegistry;

  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let randomUser: SignerWithAddress;
  let sampleInput: any, circuitWasmPath: string, circuitZkeyPath: string;

  beforeEach(async () => {
    // reset the testing chain so we can perform time related tests
    await hre.network.provider.send('hardhat_reset');

    [deployer, user, randomUser] = await hre.ethers.getSigners();

    // set up KYCRegistry, ZkKYCVerifier, ZkKYC
    const mockKYCRegistryFactory = await ethers.getContractFactory(
      'MockKYCRegistry',
      deployer
    );
    mockKYCRegistry =
      (await mockKYCRegistryFactory.deploy()) as MockKYCRegistry;

    const ageProofZkKYCVerifierFactory = await ethers.getContractFactory(
      'AgeProofZkKYCVerifier',
      deployer
    );
    ageProofZkKYCVerifier = (await ageProofZkKYCVerifierFactory.deploy()) as AgeProofZkKYCVerifier;

    const ageProofZkKYCFactory = await ethers.getContractFactory('AgeProofZkKYC', deployer);
    ageProofZkKYC = (await ageProofZkKYCFactory.deploy(
      deployer.address,
      ageProofZkKYCVerifier.address,
      mockKYCRegistry.address
    )) as AgeProofZkKYC;

    // inputs to create proof
    sampleInput = JSON.parse(
      readFileSync('./circuits/input/ageProofZkKYC.json', 'utf8')
    );

    // get signer object authorized to use the zkKYC record
    user = await hre.ethers.getImpersonatedSigner(sampleInput.userAddress);

    circuitWasmPath = './circuits/build/ageProofZkKYC.wasm';
    circuitZkeyPath = './circuits/build/ageProofZkKYC.zkey';
  });

  it('only owner can change KYCRegistry and Verifier addresses', async () => {
    // random user cannot change the addresses
    await expect(
      ageProofZkKYC.connect(user).setVerifier(user.address)
    ).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(
      ageProofZkKYC.connect(user).setKYCRegistry(user.address)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    //owner can change addresses
    await ageProofZkKYC.connect(deployer).setVerifier(user.address);
    await ageProofZkKYC.connect(deployer).setKYCRegistry(user.address);

    expect(await ageProofZkKYC.verifier()).to.be.equal(user.address);
    expect(await ageProofZkKYC.KYCRegistry()).to.be.equal(user.address);
  });

  it('correct proof can be verified onchain', async () => {
    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[1];
    const publicTime = parseInt(publicSignals[2], 10);
    // set the merkle root to the correct one
    await mockKYCRegistry.setMerkleRoot(
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [publicTime]);
    await hre.network.provider.send('evm_mine');

    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await ageProofZkKYC.connect(user).verifyProof(a, b, c, publicInputs);
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
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);

    // switch c, a to get an incorrect proof
    // it doesn't fail on time because the time change remains from the previous test
    await expect(ageProofZkKYC.connect(user).verifyProof(c, b, a, publicInputs)).to.be
      .reverted;
  });

  it('revert if proof output is invalid', async () => {
    let forgedInput = { ...sampleInput };
    // make the zkKYC record expire leading to invalid proof output
    forgedInput.currentTime = forgedInput.expirationDate + 1;

    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      forgedInput,
      circuitWasmPath,
      circuitZkeyPath
    );
    expect(publicSignals[0]).to.be.equal('0');
    const publicRoot = publicSignals[1];
    // set the merkle root to the correct one

    await mockKYCRegistry.setMerkleRoot(
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    // set time to the public time
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await expect(
      ageProofZkKYC.connect(user).verifyProof(c, b, a, publicInputs)
    ).to.be.revertedWith('the proof output is not valid');
  });

  it('revert if public output merkle root does not match with the one onchain', async () => {
    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    // we don't set the merkle root to the correct one

    // set time to the public time
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await expect(
      ageProofZkKYC.connect(user).verifyProof(c, b, a, publicInputs)
    ).to.be.revertedWith("the root in the proof doesn't match");
  });

  it('revert if time is too far from current time', async () => {
    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[1];
    const pulicTime = parseInt(publicSignals[2], 10);
    // set the merkle root to the correct one

    await mockKYCRegistry.setMerkleRoot(
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [
      pulicTime + 200,
    ]);

    await hre.network.provider.send('evm_mine');
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await expect(
      ageProofZkKYC.connect(user).verifyProof(c, b, a, publicInputs)
    ).to.be.revertedWith('the current time is incorrect');
  });

  it('unauthorized user cannot use the proof', async () => {
    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[1];
    const publicTime = parseInt(publicSignals[2], 10);
    // set the merkle root to the correct one
    await mockKYCRegistry.setMerkleRoot(
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [publicTime]);
    await hre.network.provider.send('evm_mine');

    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await expect(
      ageProofZkKYC.connect(randomUser).verifyProof(c, b, a, publicInputs)
    ).to.be.revertedWith('sender is not authorized to use this proof');
  });
});
