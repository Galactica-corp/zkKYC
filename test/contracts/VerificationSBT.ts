import { ethers } from 'hardhat';
import chai, { use } from 'chai';

chai.config.includeStack = true;

import { MockKYCRegistry } from '../../typechain-types/mock/MockKYCRegistry';
import { AgeProofZkKYC } from '../../typechain-types/AgeProofZkKYC';
import { MockGalacticaInstitution } from '../../typechain-types/mock/MockGalacticaInstitution';
import { AgeProofZkKYCVerifier } from '../../typechain-types/AgeProofZkKYCVerifier';
import { MockDApp } from '../../typechain-types/mock/MockDApp';
import { VerificationSBT } from '../../typechain-types/VerificationSBT';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const snarkjs = require('snarkjs');
import { readFileSync } from 'fs';
import { buildPoseidon } from 'circomlibjs';
const hre = require('hardhat');
import {
  fromDecToHex,
  processProof,
  processPublicSignals,
  fromHexToBytes32,
} from '../../lib/helpers';
import { decryptFraudInvestigationData } from '../../lib/SBTData';
import {
  getEddsaKeyFromEthSigner,
  createHolderCommitment,
} from '../../lib/keyManagement';
import { ZKCertificate } from '../../lib/zkCertificate';
import { ZkCertStandard } from '../../lib';

import { buildEddsa } from 'circomlibjs';

const { expect } = chai;

describe('Verification SBT Smart contract', async () => {
  let ageProofZkKYC: AgeProofZkKYC;
  let ageProofZkKYCVerifier: AgeProofZkKYCVerifier;
  let mockKYCRegistry: MockKYCRegistry;
  let mockGalacticaInstitution: MockGalacticaInstitution;
  let mockDApp: MockDApp;
  let verificationSBT: VerificationSBT;
  let token1, token2;

  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let encryptionAccount: SignerWithAddress;
  let institution: SignerWithAddress;
  let sampleInput: any, circuitWasmPath: string, circuitZkeyPath: string;

  beforeEach(async () => {
    // reset the testing chain so we can perform time related tests
    await hre.network.provider.send('hardhat_reset');

    [deployer, user, encryptionAccount, institution] =
      await hre.ethers.getSigners();

    // set up KYCRegistry, ZkKYCVerifier, ZkKYC
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

    const ageProofZkKYCVerifierFactory = await ethers.getContractFactory(
      'AgeProofZkKYCVerifier',
      deployer
    );
    ageProofZkKYCVerifier =
      (await ageProofZkKYCVerifierFactory.deploy()) as AgeProofZkKYCVerifier;

    const ageProofZkKYCFactory = await ethers.getContractFactory(
      'AgeProofZkKYC',
      deployer
    );
    ageProofZkKYC = (await ageProofZkKYCFactory.deploy(
      deployer.address,
      ageProofZkKYCVerifier.address,
      mockKYCRegistry.address,
      mockGalacticaInstitution.address
    )) as AgeProofZkKYC;

    const verificationSBTFactory = await ethers.getContractFactory(
      'VerificationSBT',
      deployer
    );
    verificationSBT =
      (await verificationSBTFactory.deploy()) as VerificationSBT;

    const mockDAppFactory = await ethers.getContractFactory(
      'MockDApp',
      deployer
    );
    mockDApp = (await mockDAppFactory.deploy(
      verificationSBT.address,
      ageProofZkKYC.address
    )) as MockDApp;

    const mockTokenFactory = await ethers.getContractFactory(
      'MockToken',
      deployer
    );

    token1 = await mockTokenFactory.deploy(mockDApp.address);
    token2 = await mockTokenFactory.deploy(mockDApp.address);

    await mockDApp.setToken1(token1.address);
    await mockDApp.setToken2(token2.address);

    // inputs to create proof
    sampleInput = JSON.parse(
      readFileSync('./circuits/input/ageProofZkKYC.json', 'utf8')
    );

    // we need to change the dAppID to the address of the MockDApp created here
    sampleInput.dAppID = mockDApp.address;
    // now we need to recalculate the humanID
    const fieldOrder = [
      'surname',
      'forename',
      'middlename',
      'yearOfBirth',
      'monthOfBirth',
      'dayOfBirth',
      'passportID',
      'dAppID',
    ];
    let poseidon = await buildPoseidon();
    sampleInput.humanID = poseidon.F.toObject(
      poseidon(
        fieldOrder.map((field) => sampleInput[field]),
        undefined,
        1
      )
    ).toString();

    // get signer object authorized to use the zkKYC record
    user = await hre.ethers.getImpersonatedSigner(sampleInput.userAddress);

    circuitWasmPath = './circuits/build/ageProofZkKYC.wasm';
    circuitZkeyPath = './circuits/build/ageProofZkKYC.zkey';
  });

  it('if the proof is correct the verification SBT is minted', async () => {
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

    // set the galactica institution pub key
    const galacticaInstitutionPubKey = [publicSignals[9], publicSignals[10]];
    await mockGalacticaInstitution.setInstitutionPubkey(
      galacticaInstitutionPubKey
    );

    // set time to the public time
    await hre.network.provider.send('evm_setNextBlockTimestamp', [publicTime]);
    await hre.network.provider.send('evm_mine');

    let [a, b, c] = processProof(proof);

    let publicInputs = processPublicSignals(publicSignals);
    await mockDApp.connect(user).airdropToken(1, a, b, c, publicInputs);

    // check that the verification SBT is created
    expect(
      await verificationSBT.isVerificationSBTValid(
        user.address,
        mockDApp.address
      )
    ).to.be.equal(true);

    // data is stored for the correct humanID
    expect(
      await mockDApp.hasReceivedToken1(
        fromHexToBytes32(fromDecToHex(sampleInput.humanID))
      )
    ).to.be.equal(true);

    // check the content of the verification SBT
    const verificationSBTInfo = await verificationSBT.getVerificationSBTInfo(
      user.address,
      mockDApp.address
    );
    expect(verificationSBTInfo.dApp).to.be.equal(mockDApp.address);
    expect(verificationSBTInfo.verifierWrapper).to.be.equal(
      ageProofZkKYC.address
    );
    expect(verificationSBTInfo.encryptedData[0]).to.be.equal(
      fromHexToBytes32(fromDecToHex(sampleInput.encryptedData[0]))
    );
    expect(verificationSBTInfo.encryptedData[1]).to.be.equal(
      fromHexToBytes32(fromDecToHex(sampleInput.encryptedData[1]))
    );

    // check that the verificationSBT can be used to receive the second token without proof
    await mockDApp.connect(user).airdropToken(
      2,
      [0, 0],
      [
        [0, 0],
        [0, 0],
      ],
      [0, 0],
      publicInputs
    );
    expect(
      await mockDApp.hasReceivedToken2(
        fromHexToBytes32(fromDecToHex(sampleInput.humanID))
      )
    ).to.be.equal(true);

    // test decryption

    const galaInstitutionPriv = BigInt(
      await getEddsaKeyFromEthSigner(institution)
    ).toString();
    const userPriv = BigInt(
      await getEddsaKeyFromEthSigner(encryptionAccount)
    ).toString();

    const eddsa = await buildEddsa();
    const userPub = eddsa.prv2pub(userPriv);
    const decryptedData = await decryptFraudInvestigationData(
      galaInstitutionPriv,
      userPub,
      verificationSBTInfo.encryptedData
    );

    expect(decryptedData[0]).to.be.equal(sampleInput.providerAx);

    const holderEdDSAKey = await getEddsaKeyFromEthSigner(deployer);
    const holderCommitment = createHolderCommitment(eddsa, holderEdDSAKey);
    let zkKYC = new ZKCertificate(
      holderCommitment,
      ZkCertStandard.zkKYC,
      eddsa,
      1773
    );
    zkKYC.setFields(sampleInput);

    expect(decryptedData[1]).to.be.equal(zkKYC.leafHash);
  });
});