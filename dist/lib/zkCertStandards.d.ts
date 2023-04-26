/**
 * Enum for zkCert standards
 */
export declare enum ZkCertStandard {
    zkKYC = "gip69"
}
/**
 * Ordered list of fields common to all zkCerts.
 */
export declare const zkCertCommonFields: string[];
/**
 * Ordered list of fields contained specifically in the zkKYC.
 * It does not include fields that are common to all zkCerts.
 */
export declare const zkKYCContentFields: string[];
export declare const humanIDFieldOrder: string[];
