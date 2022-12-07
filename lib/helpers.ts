import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

export function fromHexToDec(hex: string): string {
  if (hex.slice(0, 2) === '0x') {
    return new BigNumber(hex.slice(2).toUpperCase(), 16).toString(10);
  } else {
    return new BigNumber(hex, 16).toString(10);
  }
}

export function fromDecToHex(dec: string, withPrefix: boolean = false): string {
  if (withPrefix) {
    return '0x' + new BigNumber(dec, 10).toString(16);
  } else {
    return new BigNumber(dec, 10).toString(16);
  }
}

export function fromHexToBytes32(hex: string): string {
  if (hex.length <= 64) {
    return '0x' + new Array(64 - hex.length + 1).join(`0`) + hex;
  } else {
    throw new Error('hex string too long');
  }
}

export function generateRandomBytes32Array(length: number): Uint8Array[] {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(utils.randomBytes(32));
  }
  return result;
}

/**
 * Hashes string to field number using poseidon. This is needed to break down the string into field elements that can be used in the circuit.
 * @param input string to be hashed
 * @param poseidon poseidon object for hashing (passed to avoid rebuilding with await)
 * @returns field number as BigNumber
 */
export function hashStringToFieldNumber(input: string, poseidon: any): BigNumber {
  // prepare string for hashing (poseidon requires an array of 1 to 16 numbers
  // to allow strings longer than 16, we compress 4 characters into one 32 bit number
  const maxLength = 16 * 4;
  if (input.length > maxLength) {
    throw new Error(`Input string too long (max ${maxLength} characters)`);
  }
  
  let inputArray: number[] = [];
  if (input.length == 0) {
    inputArray = [0];
  }
  for (let i = 0; i < input.length; i += 4) {
    let charCode = 0;
    for (let j = 0; j < 4; j++) {
      if (i + j < input.length) {
        const char = input.charCodeAt(i + j);
        if (char > 255) {
          throw new Error(`Input string ${input} contains non-ascii character '${char}'`);
        }
        // shift bits into position (first character is in the most significant bits)
        charCode |= char << (8 * (3-j));
      }
    } 
    inputArray.push(charCode);
  }
  
  return poseidon.F.toObject(
    poseidon(inputArray, undefined, 1)
  ).toString();
}

// this function convert the proof output from snarkjs to parameter format for onchain solidity verifier
export function processProof(proof: any) {
  const a = proof.pi_a.slice(0, 2).map((x: any) => fromDecToHex(x, true));
  // for some reason the order of coordinate is reverse
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]].map((x) => fromDecToHex(x, true)),
    [proof.pi_b[1][1], proof.pi_b[1][0]].map((x) => fromDecToHex(x, true)),
  ];

  const c = proof.pi_c.slice(0, 2).map((x: any) => fromDecToHex(x, true));
  return [a, b, c];
}

// this function processes the public inputs
export function processPublicSignals(publicSignals: any) {
  return publicSignals.map((x: any) => fromDecToHex(x, true));
}
