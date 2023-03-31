import { ethers } from "hardhat";
import { fromDecToHex, fromHexToBytes32 } from "../lib/helpers";


async function main() {
  // parameters
  const centerRegistryAddr = '0x6e15f20e703c67047fF20acee85185cf0457f0F4';
  const recordRegistryAddr = '0x9dC3856A0D3e2d008B6F7A97594A5AD77383FA72';
  const zkKYCLeafHashes = [
    '19630604862894493237865119507631642105595355222686969752403793856928034143008',
    '913338630289763938167212770624253461411251029088142596559861590717003723041',
  ];

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

  for (const zkKYCLeafHash of zkKYCLeafHashes) {
    console.log(`Issuing zkKYC with leaf hash ${zkKYCLeafHash}`);
    const leafBytes = fromHexToBytes32(fromDecToHex(zkKYCLeafHash))
    tx = await recordRegistry.addZkKYCRecord(leafBytes);
    await tx.wait();
  }

  console.log(`Done`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
