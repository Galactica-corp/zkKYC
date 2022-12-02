"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zkCertificateFieldOrder = exports.processPublicSignals = exports.processProof = exports.generateRandomBytes32Array = exports.fromHexToBytes32 = exports.fromDecToHex = exports.fromHexToDec = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const ethers_1 = require("ethers");
function fromHexToDec(hex) {
    if (hex.slice(0, 2) === '0x') {
        return new bignumber_js_1.default(hex.slice(2).toUpperCase(), 16).toString(10);
    }
    else {
        return new bignumber_js_1.default(hex, 16).toString(10);
    }
}
exports.fromHexToDec = fromHexToDec;
function fromDecToHex(dec, withPrefix = false) {
    if (withPrefix) {
        return '0x' + new bignumber_js_1.default(dec, 10).toString(16);
    }
    else {
        return new bignumber_js_1.default(dec, 10).toString(16);
    }
}
exports.fromDecToHex = fromDecToHex;
function fromHexToBytes32(hex) {
    if (hex.length <= 64) {
        return '0x' + new Array(64 - hex.length + 1).join(`0`) + hex;
    }
    else {
        throw new Error('hex string too long');
    }
}
exports.fromHexToBytes32 = fromHexToBytes32;
function generateRandomBytes32Array(length) {
    const result = [];
    for (let i = 0; i < length; i++) {
        result.push(ethers_1.utils.randomBytes(32));
    }
    return result;
}
exports.generateRandomBytes32Array = generateRandomBytes32Array;
// this function convert the proof output from snarkjs to parameter format for onchain solidity verifier
function processProof(proof) {
    const a = proof.pi_a.slice(0, 2).map((x) => fromDecToHex(x, true));
    // for some reason the order of coordinate is reverse
    const b = [
        [proof.pi_b[0][1], proof.pi_b[0][0]].map((x) => fromDecToHex(x, true)),
        [proof.pi_b[1][1], proof.pi_b[1][0]].map((x) => fromDecToHex(x, true)),
    ];
    const c = proof.pi_c.slice(0, 2).map((x) => fromDecToHex(x, true));
    return [a, b, c];
}
exports.processProof = processProof;
// this function processes the public inputs
function processPublicSignals(publicSignals) {
    return publicSignals.map((x) => fromDecToHex(x, true));
}
exports.processPublicSignals = processPublicSignals;
exports.zkCertificateFieldOrder = [
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
