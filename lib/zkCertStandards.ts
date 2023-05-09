/* Copyright (C) 2023 Galactica Network. This file is part of zkKYC. zkKYC is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. zkKYC is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. */
/**
 * Enum for zkCert standards
 */
 export enum ZkCertStandard {
    zkKYC = 'gip69',
}

/**
 * Ordered list of fields common to all zkCerts.
 */
export const zkCertCommonFields = [
  'contentHash',
  'providerAx',
  'providerAy',
  'providerS',
  'providerR8x',
  'providerR8y',
  'holderCommitment',
  'randomSalt',
];

/**
 * Ordered list of fields contained specifically in the zkKYC.
 * It does not include fields that are common to all zkCerts.
 */
export const zkKYCContentFields = [
  'surname',
  'forename',
  'middlename',
  'yearOfBirth',
  'monthOfBirth',
  'dayOfBirth',
  'verificationLevel',
  'expirationDate',
  'streetAndNumber',
  'postcode',
  'town',
  'region',
  'country',
  'citizenship',
  'passportID',
];

export const humanIDFieldOrder = [
  'surname',
  'forename',
  'middlename',
  'yearOfBirth',
  'monthOfBirth',
  'dayOfBirth',
  'passportID',
  'dAppAddress',
];
