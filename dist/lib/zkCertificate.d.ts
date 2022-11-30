/**
 * @description Class for managing and constructing zkCertificates, the generalized version of zkKYC.
 * @dev specification can be found here: https://docs.google.com/document/d/16R_CI7oj-OqRoIm6Ipo9vEpUQmgaVv7fL2yI4NTX9qw/edit?pli=1#heading=h.ah3xat5fhvac
 */
export declare class ZKCertificate {
    private holderKey;
    protected poseidon: any;
    protected eddsa: any;
    private fields;
    protected fieldPoseidon: any;
    readonly holderCommitment: string;
    holderPubKeyEddsa: any;
    /**
     * @description Create a ZKCertificate
     *
     * @param holderKey EdDSA Private key of the holder. Used to derive pubkey and sign holder commitment.
     *   TODO: move private key out of this class into Metamaks callback or something similar
     * @param poseidon Poseidon instance to use for hashing
     *
     * @param fields ZKCertificate parameters, can be set later
     */
    constructor(holderKey: string, poseidon: any, eddsa: any, fields?: Record<string, any>);
    get leafHash(): string;
    setFields(fields: Record<string, any>): void;
    /**
     * @description Create the input for the ownership proof of this zkCert
     *
     * @param holderKey EdDSA Private key of the holder
     * @returns OwnershipProofInput struct
     */
    getOwnershipProofInput(holderKey: string): OwnershipProofInput;
    /**
     * @description Create the input for the authorization proof of this zkCert
     *
     * @param holderKey EdDSA Private key of the holder
     * @param userAddress user address to be signed
     * @returns AuthorizationProofInput struct
     */
    getAuthorizationProofInput(holderKey: string, userAddress: string): AuthorizationProofInput;
    /**
     * @description Create the holder commitment according to the spec to fix the ownership of the zkCert
     * @dev holder commitment = poseidon(sign_eddsa(poseidon(pubkey)))
     *
     * @param privateKey EdDSA Private key of the holder
     * @returns holder commitment
     */
    private createHolderCommitment;
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
