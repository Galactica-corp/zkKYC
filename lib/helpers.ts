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

export function generateRandomBytes32Array(length: number): Uint8Array[] {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(ethers.utils.randomBytes(32));
  }
  return result;
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
