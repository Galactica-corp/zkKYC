"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryVerificationSBTs = void 0;
const ethers_1 = require("ethers");
const hardhat_1 = require("hardhat");
/**
 * @description Finds verification SBTs for a user. Searches through logs of created verificationSBTs
 *   and filters according to the userAddr, dAppAddr, and humanID provided.
 *
 * @param sbtContractAddr Address of the verification SBT contract holding the mapping of completed verifications
 * @param userAddr Address of the user to find verification SBTs for (default: undefined)
 * @param dAppAddr Address of the dApp the SBT was created for (default: undefined)
 * @param humanID HumanID of the user the SBT was created for (default: undefined)
 * @param filterExpiration Whether to filter out expired SBTs (default: false)
 * @returns Map of verification SBTs (address of contract it was proven to => verification SBT data)
 */
async function queryVerificationSBTs(sbtContractAddr, userAddr = undefined, dAppAddr = undefined, humanID = undefined, filterExpiration = false) {
    const factory = await hardhat_1.ethers.getContractFactory("VerificationSBT");
    const sbtContract = factory.attach(sbtContractAddr);
    const currentBlock = await hardhat_1.ethers.provider.getBlockNumber();
    const lastBlockTime = (await hardhat_1.ethers.provider.getBlock(currentBlock)).timestamp;
    let sbtListRes = new Map();
    // go through all logs adding a verification SBT for the user
    const createStakeLogs = await sbtContract.queryFilter(sbtContract.filters.VerificationSBTMinted(dAppAddr, userAddr, humanID));
    for (let log of createStakeLogs) {
        const loggedDApp = log.args[0];
        const loggedUser = log.args[1];
        const sbtInfo = await sbtContract.getVerificationSBTInfo(loggedUser, loggedDApp);
        // check if the SBT is still valid
        if (filterExpiration && sbtInfo.expirationTime < ethers_1.BigNumber.from(lastBlockTime)) {
            continue;
        }
        if (sbtListRes.has(loggedDApp)) {
            sbtListRes.get(loggedDApp).push(sbtInfo);
        }
        else {
            sbtListRes.set(loggedDApp, [sbtInfo]);
        }
    }
    return sbtListRes;
}
exports.queryVerificationSBTs = queryVerificationSBTs;
