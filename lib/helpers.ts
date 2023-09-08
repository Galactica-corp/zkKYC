/* Copyright (C) 2023 Galactica Network. This file is part of zkKYC. zkKYC is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. zkKYC is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. */
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

import type { HardhatRuntimeEnvironment } from 'hardhat/types';

/**
 * Overwrites build artifacts to inject generated bytecode
 *
 * @param hre - hardhat runtime environment
 * @param contractName - contract name to overwrite
 * @param bytecode - bytecode to inject
 * @returns promise for completion
 */
export async function overwriteArtifact(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  bytecode: string
): Promise<void> {
  const artifact = await hre.artifacts.readArtifact(contractName);
  artifact.bytecode = bytecode;
  await hre.artifacts.saveArtifactAndDebugFile(artifact);
}

export const SNARK_SCALAR_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

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

export function generateRandomBytes32Array(length: number): string[] {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(fromHexToBytes32(fromDecToHex(ethers.BigNumber.from(utils.randomBytes(32)).toString())));
  }
  return result;
}

export function generateRandomNumberArray(length: number): any[] {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(ethers.BigNumber.from(utils.randomBytes(2)));

  }
  return result;
}

/**
 * Hashes string to field number using poseidon. This is needed to break down the string into field elements that can be used in the circuit.
 * @param input string to be hashed
 * @param poseidon poseidon object for hashing (passed to avoid rebuilding with await)
 * @returns field number as BigNumber
 */
export function hashStringToFieldNumber(
  input: string,
  poseidon: any
): BigNumber {
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
          throw new Error(
            `Input string ${input} contains non-ascii character '${char}'`
          );
        }
        // shift bits into position (first character is in the most significant bits)
        charCode |= char << (8 * (3 - j));
      }
    }
    inputArray.push(charCode);
  }

  return poseidon.F.toObject(poseidon(inputArray, undefined, 1)).toString();
}

/**
 * Convert typed byte array to bigint
 *
 * @param array - Array to convert
 * @returns bigint
 */
export function arrayToBigInt(array: Uint8Array): bigint {
  // Initialize result as 0
  let result = 0n;

  // Loop through each element in the array
  array.forEach((element) => {
    // Shift result bits left by 1 byte
    result = result << 8n;

    // Add element to result, filling the last bit positions
    result += BigInt(element);
  });
  return result;
}

/**
 * Convert bigint to byte array
 *
 * @param bn - bigint
 * @returns byte array
 */
export function bigIntToArray(bn: bigint): Uint8Array {
  // Convert bigint to hex string
  let hex = BigInt(bn).toString(16);

  // If hex is odd length then add leading zero
  if (hex.length % 2) hex = `0${hex}`;

  // Split into groups of 2 to create hex array
  const hexArray = hex.match(/.{2}/g) ?? [];

  // Convert hex array to uint8 byte array
  const byteArray = new Uint8Array(hexArray.map((byte) => parseInt(byte, 16)));

  return byteArray;
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
