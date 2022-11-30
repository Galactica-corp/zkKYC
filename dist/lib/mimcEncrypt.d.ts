/**
 * SNARK efficient encryption and decryption with mimc in sponge mode.
 * Merged circomlibjs with version from https://github.com/iden3/circomlib/pull/16
 *
 * TODO: This should be audited before using in production with real user data.
 * The MimcEncrypt only encrypts a single field element. If we need to encrypt more
 *  it might make sense in the future to take a look at Poseidon encryption:
 *  - spec: https://drive.google.com/file/d/1EVrP3DzoGbmzkRmYnyEDcIQcXVU7GlOd/view
 *  - implementation (not audited and not compatible as is): https://github.com/iden3/circomlib/pull/60
 */
export declare function buildMimcSponge(): Promise<MimcEncrypt>;
export declare class MimcEncrypt {
    F: any;
    cts: any[];
    constructor(F: any);
    getIV(seed: any): any;
    getConstants(seed: any, nRounds: number): any[];
    hash(_xL_in: any, _xR_in: any, _k: any): {
        xL: any;
        xR: any;
    };
    permutation(_xL_in: any, _xR_in: any, _k: any, _rev: any): {
        xL: any;
        xR: any;
    };
    encrypt(_xL_in: any, _xR_in: any, _k: any): {
        xL: any;
        xR: any;
    };
    decrypt(_xL_in: any, _xR_in: any, _k: any): {
        xL: any;
        xR: any;
    };
    multiHash(arr: any[], key: any, numOutputs: number): any;
}
