import { VerificationSBT } from '../typechain-types/contracts/VerificationSBT';
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
export declare function queryVerificationSBTs(sbtContractAddr: string, userAddr?: string | undefined, dAppAddr?: string | undefined, humanID?: string | undefined, filterExpiration?: boolean): Promise<Map<string, VerificationSBT.VerificationSBTInfoStruct[]>>;
