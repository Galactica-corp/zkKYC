"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.humanIDFieldOrder = exports.zkKYCContentFields = exports.zkCertCommonFields = exports.ZkCertStandard = void 0;
/**
 * Enum for zkCert standards
 */
var ZkCertStandard;
(function (ZkCertStandard) {
    ZkCertStandard["zkKYC"] = "gip69";
})(ZkCertStandard = exports.ZkCertStandard || (exports.ZkCertStandard = {}));
/**
 * Ordered list of fields common to all zkCerts.
 */
exports.zkCertCommonFields = [
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
exports.zkKYCContentFields = [
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
exports.humanIDFieldOrder = [
    'surname',
    'forename',
    'middlename',
    'yearOfBirth',
    'monthOfBirth',
    'dayOfBirth',
    'passportID',
    'dAppAddress',
];
