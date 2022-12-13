import BigNumber from 'bignumber.js';
export declare function fromHexToDec(hex: string): string;
export declare function fromDecToHex(dec: string, withPrefix?: boolean): string;
export declare function fromHexToBytes32(hex: string): string;
export declare function generateRandomBytes32Array(length: number): Uint8Array[];
/**
 * Hashes string to field number using poseidon. This is needed to break down the string into field elements that can be used in the circuit.
 * @param input string to be hashed
 * @param poseidon poseidon object for hashing (passed to avoid rebuilding with await)
 * @returns field number as BigNumber
 */
export declare function hashStringToFieldNumber(input: string, poseidon: any): BigNumber;
export declare function processProof(proof: any): any[];
export declare function processPublicSignals(publicSignals: any): any;
