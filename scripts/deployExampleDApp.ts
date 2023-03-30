import hre from "hardhat";
import { deploySC } from '../lib/hardhatHelpers';

const log = console.log;


async function main() {
  // parameters
  const verificationSBT = '0x10EAf134de4900B7A6E123a56CFEb166C2a6D71B';
  const ageProofZkKYC = '0x6CddF80a1C8B3DAdA9B2A1EA3fe591A9727762f2';

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
