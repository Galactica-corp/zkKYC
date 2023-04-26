import { ZkCertStandard } from './zkCertStandards';
/**
 * @description Class for managing and constructing zkCertificates, the generalized version of zkKYC.
 * @dev specification can be found here: https://docs.google.com/document/d/16R_CI7oj-OqRoIm6Ipo9vEpUQmgaVv7fL2yI4NTX9qw/edit?pli=1#heading=h.ah3xat5fhvac
 */
export declare class ZKCertificate {
    readonly holderCommitment: string;
    zkCertStandard: ZkCertStandard;
    protected eddsa: any;
    randomSalt: number;
    fields: Record<string, any>;
    providerData: ProviderData;
    protected poseidon: any;
    protected fieldPoseidon: any;
    /**
     * @description Create a ZKCertificate
     *
     * @param holderCommitment commitment fixing the holder eddsa key without revealing it to the provider
     * @param zkCertStandard zkCert standard to use
     * @param eddsa eddsa instance to use for signing
     * @param randomSalt random salt randomizing the zkCert
     * @param fields ZKCertificate parameters, can be set later
     * @param providerData provider data, can be set later
     *
     * @param fields ZKCertificate parameters, can be set later
     */
    constructor(holderCommitment: string, zkCertStandard: ZkCertStandard, // TODO: move enum from snap here
    eddsa: any, randomSalt: number, fields?: Record<string, any>, // standardize field definitions
    providerData?: ProviderData);
    get contentHash(): string;
    get leafHash(): string;
    get providerMessage(): string;
    get did(): string;
    setFields(fields: Record<string, any>): void;
    /**
     * Export the zkCert as a JSON string that can be imported in the Galactica Snap for Metamask
     * TODO: add encryption option
     * @returns JSON string
     */
    exportJson(): string;
    /**
     * @description Create the input for the ownership proof of this zkCert
     *
     * @param holderKey EdDSA Private key of the holder
     * @returns OwnershipProofInput struct
     */
    getOwnershipProofInput(holderKey: string): OwnershipProofInput;
    /**
     * @description Create the input for the provider signature check of this zkCert
     *
     * @param providerKey EdDSA Private key of the KYC provider
     * @returns ProviderData struct
     */
    signWithProvider(providerKey: string): ProviderData;
    /**
     * @description Create the input for the authorization proof of this zkCert
     *
     * @param holderKey EdDSA Private key of the holder
     * @param userAddress user address to be signed
     * @returns AuthorizationProofInput struct
     */
    getAuthorizationProofInput(holderKey: string, userAddress: string): AuthorizationProofInput;
    /**
     * @description Create the input for the fraud investigation data encryption proof of this zkCert
     *
     * @param galaInstitutionPubKey
     * @param userPrivKey
     * @param providerPubKey
     * @param zkCertHash
     * @returns
     */
    getFraudInvestigationDataEncryptionProofInput(institutionPub: string[], userPrivKey: string): Promise<FraudInvestigationDataEncryptionProofInput>;
    /**
     * @description Calculate dApp specific human ID from zkKYC and dApp address.
     *
     * @param dAppAddress Address of the dApp.
     * @returns Human ID as string.
     */
    getHumanID(dAppAddress: string): string;
    getHumanIDProofInput(dAppAddress: string, passportID: string): HumanIDProofInput;
}
export interface OwnershipProofInput {
    holderCommitment: string;
    Ax: string;
    Ay: string;
    S: string;
    R8x: string;
    R8y: string;
}
export interface AuthorizationProofInput {
    userAddress: string;
    Ax: string;
    Ay: string;
    S: string;
    R8x: string;
    R8y: string;
}
export interface ProviderData {
    Ax: string;
    Ay: string;
    S: string;
    R8x: string;
    R8y: string;
}
export interface FraudInvestigationDataEncryptionProofInput {
    userPrivKey: string;
    userPubKey: string[];
    investigationInstitutionPubkey: string[];
    encryptedData: string[];
}
export interface HumanIDProofInput {
    passportID: string;
    dAppAddress: string;
    humanID: string;
}
