import { ethers } from 'hardhat';
import chai, { use } from 'chai';
import { solidity } from 'ethereum-waffle';

chai.config.includeStack = true;

import { MockKYCRegistry } from '../typechain/LTRescue';
import { ZkKYC } from '../typechain/ProtocolToken';
import { ZkKYCVerifier } from '../typechain/Pair';

import { deployMockContract } from '@ethereum-waffle/mock-contract';
import { BigNumber, ContractTransaction, providers, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const fs = require('fs');
const hre = require('hardhat');

chai.use(solidity);
const { expect } = chai;

describe.skip('zkKYC', () => {
  let zkKYC: ZkKYC;
  let zkKYCVerifier: ZkKYCVerifier;
  let mockKYCRegistry: MockKYCRegistry;

  let deployer: SignerWithAddress;
  let user: SignerWithAddress;

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

    const zkKYCFactory = await ethers.getContractFactory('zkKYC', deployer);
    zkKYC = (await zkKYCFactory.deploy(
      deployer.address,
      zkKYCVerifier.address,
      mockKYCRegistry.address
    )) as ZkKYCVerifier;

  });

  it.only('only owner can change KYCRegistry and Verifier addresses', async () => {
    
  });
});
