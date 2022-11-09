import BigNumber from 'bignumber.js';

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
