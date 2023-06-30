/* Copyright (C) 2023 Galactica Network. This file is part of zkKYC. zkKYC is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. zkKYC is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. */
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types';
import { KYCRecordRegistry } from '../typechain-types/contracts/KYCRecordRegistry';

/**
 * @description Query the on-chain Merkle tree leaves needed as input for the Merkle tree
 * @param ethers Ethers instance
 * @param contractAddr Address of the KYCRecordRegistry contract
 * @param firstBlock First block to query (ideally the contract creation block)
 * @returns Promise of an array of Merkle tree leaves
 */

export interface LeafLogResult {
  leafHash: string;
    index: BigInt;
}
export async function queryOnChainLeaves(ethers: HardhatEthersHelpers, contractAddr: string, firstBlock: number = 1): (Promise<LeafLogResult[]>) {
  const contract = await ethers.getContractAt("KYCRecordRegistry", contractAddr) as KYCRecordRegistry;

  const currentBlock = await ethers.provider.getBlockNumber();
  let res : LeafLogResult[] = [];

  const maxBlockInterval = 10000;
  console.log(`Getting Merkle tree leaves by reading blockchain log from ${firstBlock} to ${currentBlock}`);

  // get logs in batches of 10000 blocks because of rpc call size limit
  for (let i = firstBlock; i < currentBlock; i += maxBlockInterval) {
    const maxBlock = Math.min(i + maxBlockInterval, currentBlock);
    // display progress in %
    printProgress(`${Math.round(((maxBlock-firstBlock) / (currentBlock-firstBlock)) * 100)}`);

    // go through all logs adding a verification SBT for the user
    const leafAddedLogs = await contract.queryFilter(contract.filters.zkKYCRecordAddition(), i, maxBlock);
    const leafRevokedLogs = await contract.queryFilter(contract.filters.zkKYCRecordRevocation(), i, maxBlock);

    for (let log of leafAddedLogs) {
      const leafHex = log.args[0];
      let leafRevoked = false;
      for (let log2 of leafRevokedLogs) {
        if (leafHex === log2.args[0]) {
          leafRevoked = true;
            break;
          }
      }
      if (!leafRevoked) {
        const index = log.args[2];
        const indexBigInt = BigInt(index);
        const leafDecimalString = BigInt(leafHex).toString();
        res.push({leafHash: leafDecimalString, index: indexBigInt});
      }
    }
  }
  printProgress(`100`);
  console.log(``);
  return res;
}

function printProgress(progress: string) {
  process.stdout.clearLine(-1);
  process.stdout.cursorTo(0);
  process.stdout.write(progress + '%');
}