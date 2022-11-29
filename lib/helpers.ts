import BigNumber from 'bignumber.js';
import { ethers } from 'hardhat';

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
    result.push(ethers.utils.randomBytes(32));
  }
  return result;
}

// this function convert the proof output from snarkjs to parameter format for onchain solidity verifier
export function processProof(proof: any) {
  const a = proof.pi_a.slice(0, 2).map((x) => fromDecToHex(x, true));
  // for some reason the order of coordinate is reverse
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]].map((x) => fromDecToHex(x, true)),
    [proof.pi_b[1][1], proof.pi_b[1][0]].map((x) => fromDecToHex(x, true)),
  ];

  const c = proof.pi_c.slice(0, 2).map((x) => fromDecToHex(x, true));
  return [a, b, c];
}

// this function processes the public inputs
export function processPublicSignals(publicSignals: any) {
  return publicSignals.map((x) => fromDecToHex(x, true));
}

export const zkCertificateFieldOrder = [
  'surname',
  'forename',
  'middlename',
  'yearOfBirth',
  'monthOfBirth',
  'dayOfBirth',
  'verificationLevel',
  'expirationDate',
  'holderCommitment',
  'providerSignature',
  'randomSalt',
  'streetAndNumber',
  'postcode',
  'town',
  'region',
  'country',
];
