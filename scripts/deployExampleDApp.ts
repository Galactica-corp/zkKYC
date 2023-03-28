import hre from "hardhat";
import { deploySC } from '../lib/hardhatHelpers';

const log = console.log;


async function main() {
  // parameters
  const verificationSBT = '0x127e53B84B69bEDd2D5C38602A17E13714ca0Ce3';
  const ageProofZkKYC = '0xC7feE6415D72ba660a759487af89EF099F169E3D';

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
