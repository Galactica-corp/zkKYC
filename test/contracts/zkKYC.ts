import { ethers } from 'hardhat';
import chai, { use } from 'chai';

chai.config.includeStack = true;

import { MockKYCRegistry } from '../../typechain-types/contracts/mock/MockKYCRegistry';
import { MockGalacticaInstitution } from '../../typechain-types/contracts/mock/MockGalacticaInstitution';
import { ZkKYC } from '../../typechain-types/contracts/ZkKYC';
import { ZkKYCVerifier } from '../../typechain-types/contracts/ZkKYCVerifier';

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
import { generateZKKYCInput } from '../../scripts/generateZKKYCInput';
import { BigNumber } from 'ethers';

const { expect } = chai;

describe('zkKYC SC', async () => {
  // reset the testing chain so we can perform time related tests
  /* await hre.network.provider.send('hardhat_reset'); */
  let zkKYC: ZkKYC;
  let zkKYCVerifier: ZkKYCVerifier;
  let mockKYCRegistry: MockKYCRegistry;
  let mockGalacticaInstitution: MockGalacticaInstitution;

  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let randomUser: SignerWithAddress;
  let sampleInput: any, circuitWasmPath: string, circuitZkeyPath: string;

  beforeEach(async () => {
    // reset the testing chain so we can perform time related tests
    await hre.network.provider.send('hardhat_reset');

    [deployer, user, randomUser] = await hre.ethers.getSigners();

    // set up KYCRegistry, GalacticaInstitution, ZkKYCVerifier, ZkKYC
    const mockKYCRegistryFactory = await ethers.getContractFactory(
      'MockKYCRegistry',
      deployer
    );
    mockKYCRegistry =
      (await mockKYCRegistryFactory.deploy()) as MockKYCRegistry;

    const mockGalacticaInstitutionFactory = await ethers.getContractFactory(
      'MockGalacticaInstitution',
      deployer
    );
    mockGalacticaInstitution =
      (await mockGalacticaInstitutionFactory.deploy()) as MockGalacticaInstitution;

    const zkKYCVerifierFactory = await ethers.getContractFactory(
      'ZkKYCVerifier',
      deployer
    );
    zkKYCVerifier = (await zkKYCVerifierFactory.deploy()) as ZkKYCVerifier;

    const zkKYCFactory = await ethers.getContractFactory('ZkKYC', deployer);
    zkKYC = (await zkKYCFactory.deploy(
      deployer.address,
      zkKYCVerifier.address,
      mockKYCRegistry.address,
      mockGalacticaInstitution.address
    )) as ZkKYC;

    sampleInput = await generateZKKYCInput();

    // get signer object authorized to use the zkKYC record
    user = await hre.ethers.getImpersonatedSigner(sampleInput.userAddress);

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

    const publicRoot = publicSignals[await zkKYC.INDEX_ROOT()];
    const publicTime = parseInt(publicSignals[await zkKYC.INDEX_CURRENT_TIME()], 10);
    // set the merkle root to the correct one
    await mockKYCRegistry.setMerkleRoot(
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    // set the galactica institution pub key
    const galacticaInstitutionPubKey: [BigNumber, BigNumber] = [
      publicSignals[await zkKYC.INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AX()],
      publicSignals[await zkKYC.INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AY()]
    ];
    await mockGalacticaInstitution.setInstitutionPubkey(
      galacticaInstitutionPubKey
    );

    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [publicTime]);
    await hre.network.provider.send('evm_mine');

    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await zkKYC.connect(user).verifyProof(a, b, c, publicInputs);
  });

  it('incorrect proof failed to be verified', async () => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[await zkKYC.INDEX_ROOT()];
    // set the merkle root to the correct one
    await mockKYCRegistry.setMerkleRoot(
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);

    // switch c, a to get an incorrect proof
    await expect(zkKYC.connect(user).verifyProof(c, b, a, publicInputs)).to.be
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
    expect(publicSignals[await zkKYC.INDEX_IS_VALID()]).to.be.equal('0');
    const publicRoot = publicSignals[await zkKYC.INDEX_ROOT()];
    // set the merkle root to the correct one

    await mockKYCRegistry.setMerkleRoot(
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    // set time to the public time
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await expect(
      zkKYC.connect(user).verifyProof(c, b, a, publicInputs)
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
      zkKYC.connect(user).verifyProof(c, b, a, publicInputs)
    ).to.be.revertedWith("the root in the proof doesn't match");
  });

  it('revert if time is too far from current time', async () => {
    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[await zkKYC.INDEX_ROOT()];
    const publicTime = parseInt(publicSignals[await zkKYC.INDEX_CURRENT_TIME()], 10);
    // set the merkle root to the correct one

    await mockKYCRegistry.setMerkleRoot(
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [
      publicTime + 200,
    ]);

    await hre.network.provider.send('evm_mine');
    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await expect(
      zkKYC.connect(user).verifyProof(c, b, a, publicInputs)
    ).to.be.revertedWith('the current time is incorrect');
  });

  it('unauthorized user cannot use the proof', async () => {
    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[await zkKYC.INDEX_ROOT()];
    const publicTime = parseInt(publicSignals[await zkKYC.INDEX_CURRENT_TIME()], 10);
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
      zkKYC.connect(randomUser).verifyProof(c, b, a, publicInputs)
    ).to.be.revertedWith(
      'transaction submitter is not authorized to use this proof'
    );
  });

  it('revert if the institution pub key is incorrect', async () => {
    let { proof, publicSignals } = await snarkjs.groth16.fullProve(
      sampleInput,
      circuitWasmPath,
      circuitZkeyPath
    );

    const publicRoot = publicSignals[await zkKYC.INDEX_ROOT()];
    const publicTime = parseInt(publicSignals[await zkKYC.INDEX_CURRENT_TIME()], 10);
    // set the merkle root to the correct one
    await mockKYCRegistry.setMerkleRoot(
      fromHexToBytes32(fromDecToHex(publicRoot))
    );
    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [publicTime]);
    await hre.network.provider.send('evm_mine');

    // set the incorrect galactica institution pub key

    const galacticaInstitutionPubKey: [BigNumber, BigNumber] = [
      BigNumber.from(publicSignals[await zkKYC.INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AX()]).add('1'),
      publicSignals[await zkKYC.INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AY()]
    ];
    await mockGalacticaInstitution.setInstitutionPubkey(
      galacticaInstitutionPubKey
    );

    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await expect(
      zkKYC.connect(user).verifyProof(c, b, a, publicInputs)
    ).to.be.revertedWith('the first part of institution pubkey is incorrect');
  });
});
