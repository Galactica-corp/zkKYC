import { ethers } from "hardhat";
import { fromDecToHex, fromHexToBytes32 } from "../lib/helpers";


async function main() {
  // parameters
  const centerRegistryAddr = '0x4a150538E297E06d18580b0Ec2caC66e88cFA32C';
  const recordRegistryAddr = '0x862Cc9FE60F6c53080D524f2997aB2595F4C09eC';
  const zkKYCLeafHash = '3117336777051834855540872560265552874773137464163281414505601608025080702835';

  // wallets
  const [ deployer ] = await ethers.getSigners();
  console.log(`Using account ${deployer.address} as KYC provider`);
  console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);
  console.log();


  // get contracts
  const centerRegistry = await ethers.getContractAt('KYCCenterRegistry', centerRegistryAddr);
  const recordRegistry = await ethers.getContractAt('KYCRecordRegistry', recordRegistryAddr);

  console.log(`Adding ${deployer.address} as KYC provider...`);
  // TODO: skip when already added
  let tx = await centerRegistry.grantKYCCenterRole(deployer.address);
  await tx.wait();

  console.log(`Issuing zkKYC with leaf hash ${zkKYCLeafHash}`);
  const leafBytes = fromHexToBytes32(fromDecToHex(zkKYCLeafHash))
  tx = await recordRegistry.addZkKYCRecord(leafBytes);
  await tx.wait();

  console.log(`Done`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
