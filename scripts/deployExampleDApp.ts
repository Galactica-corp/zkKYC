import hre from "hardhat";
import { deploySC } from '../lib/hardhatHelpers';

const log = console.log;


async function main() {
  // parameters
  const verificationSBT = '0x4De49e2047eE726B833fa815bf7392958245832d';
  const ageProofZkKYC = '0x0D11ddDcAcd7A998a2D47Ae93bFc7A1b3FA81256';

  // wallets
  const [ deployer ] = await hre.ethers.getSigners();
  log(`Using account ${deployer.address} to deploy contracts`);
  log(`Account balance: ${(await deployer.getBalance()).toString()}`);
  
  // deploying everything
  const mockDApp = await deploySC('MockDApp', true, {},
    [verificationSBT, ageProofZkKYC]
  );
  const token1 = await deploySC('contracts/mock/MockToken.sol:MockToken', true, {}, [mockDApp.address]);
  const token2 = await deploySC('contracts/mock/MockToken.sol:MockToken', true, {}, [mockDApp.address]);

  await mockDApp.setToken1(token1.address);
  await mockDApp.setToken2(token2.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
