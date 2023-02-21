import { ethers } from "hardhat";
import { fromDecToHex, fromHexToBytes32 } from "../lib/helpers";


async function main() {
  // parameters
  const centerRegistryAddr = '0xdA651B29318Ca44d5f99DFA102483fBF8ab6Fd32';
  const recordRegistryAddr = '0x5A040bA7C0eA4ae51b07Fd247a16BA767D716A75';
  const zkKYCLeafHashes = [
    '3117336777051834855540872560265552874773137464163281414505601608025080702835',
    '11690962910717114621585926656367784137101499736064175664387577423028391106711',
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

  for (const i in zkKYCLeafHashes) {
    console.log(`Issuing zkKYC with leaf hash ${zkKYCLeafHashes[i]}`);
    const leafBytes = fromHexToBytes32(fromDecToHex(zkKYCLeafHashes[i]))
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
