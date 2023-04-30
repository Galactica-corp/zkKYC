import hre from "hardhat";
import { deploySC } from '../lib/hardhatHelpers';

const log = console.log;


async function main() {
  // parameters
  const verificationSBT = '0xA4ad47FBb926fa605942d025DD5e232A533b5c30';
  const ageProofZkKYC = '0x6E5eeD7b04532C33E3689aEFd5596E98Cb694bF5';

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
