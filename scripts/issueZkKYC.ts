import { ethers } from "hardhat";
import { fromDecToHex, fromHexToBytes32 } from "../lib/helpers";


async function main() {
  // parameters
  const centerRegistryAddr = '0x85301D2A48527114c9BA7746732615F3E4f9cc5f';
  const recordRegistryAddr = '0xc8410FE3bC9b7D728767cB9cD7F5F89bBcA6eF69';
  const zkKYCLeafHash = '913338630289763938167212770624253461411251029088142596559861590717003723041';

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
