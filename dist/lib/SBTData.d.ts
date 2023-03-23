/**
 * @description Generates encrypted data for fraud investigation
 *
 * @param galaInstitutionPubKey: public
 * @param userPrivKey: encryption key derived from user private key
 * @param providerPubKey: the provider pubkey contains 2 uint256, but we only take the first one, it is enough for identification
 * @param zkCertHash:
 * @return encryptedData
 */
export declare function encryptFraudInvestigationData(galaInstitutionPub: string[], userPrivKey: string, providerPubKey: string, zkCertHash: string): Promise<any[]>;
export declare function decryptFraudInvestigationData(galaInstitutionPrivKey: string, userPubKey: string[], encryptedData: string[]): Promise<any[]>;
