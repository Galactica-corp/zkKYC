"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPublicSignals = exports.processProof = exports.hashStringToFieldNumber = exports.generateRandomBytes32Array = exports.fromHexToBytes32 = exports.fromDecToHex = exports.fromHexToDec = void 0;
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
/**
 * Hashes string to field number using poseidon. This is needed to break down the string into field elements that can be used in the circuit.
 * @param input string to be hashed
 * @param poseidon poseidon object for hashing (passed to avoid rebuilding with await)
 * @returns field number as BigNumber
 */
function hashStringToFieldNumber(input, poseidon) {
    // prepare string for hashing (poseidon requires an array of 1 to 16 numbers
    // to allow strings longer than 16, we compress 4 characters into one 32 bit number
    const maxLength = 16 * 4;
    if (input.length > maxLength) {
        throw new Error(`Input string too long (max ${maxLength} characters)`);
    }
    let inputArray = [];
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
                charCode |= char << (8 * (3 - j));
            }
        }
        inputArray.push(charCode);
    }
    return poseidon.F.toObject(poseidon(inputArray, undefined, 1)).toString();
}
exports.hashStringToFieldNumber = hashStringToFieldNumber;
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
