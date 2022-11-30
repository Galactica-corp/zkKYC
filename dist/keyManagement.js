"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPrivKeyForBabyJub = exports.generateEcdhSharedKey = exports.getEddsaKeyFromEthSigner = exports.eddsaPrimeFieldMod = exports.eddsaKeyGenerationMessage = void 0;
const blake_hash_1 = __importDefault(require("blake-hash"));
const ffjavascript_1 = require("ffjavascript");
exports.eddsaKeyGenerationMessage = "Signing this message generates your EdDSA private key. Only do this on pages you trust to manage your zkCertificates.";
exports.eddsaPrimeFieldMod = "2736030358979909402780800718157159386076813972158567259200215660948447373040";
/**
 * @description Generates the eddsa private key from the ethereum private key signing a fixed message
 *
 * @param signer Ethers signer
 * @return The eddsa private key.
 */
async function getEddsaKeyFromEthSigner(signer) {
    return signer.signMessage(exports.eddsaKeyGenerationMessage);
}
exports.getEddsaKeyFromEthSigner = getEddsaKeyFromEthSigner;
/**
 * @description Generates an Elliptic-curve Diffie–Hellman shared key https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman
 *   It is symmetric and can be produced by both parties using their private key and the other party's public key.
 *   Implementation based on https://github.com/privacy-scaling-explorations/maci/blob/796c3fa49d4983478d306061f094cf8a7532d63a/crypto/ts/index.ts#L328
 *
 * @param privKey EdDSA private key of Alice
 * @param pubKey EdDSA public key of Bob
 * @param eddsa eddsa instance from circomlibjs
 * @return The ECDH shared key.
 */
function generateEcdhSharedKey(privKey, pubKey, eddsa) {
    const keyBuffers = eddsa.babyJub.mulPointEscalar(pubKey, formatPrivKeyForBabyJub(privKey, eddsa));
    return keyBuffers.map((buffer) => eddsa.F.toObject(buffer).toString());
}
exports.generateEcdhSharedKey = generateEcdhSharedKey;
/**
 * @description Format a random private key to be compatible with the BabyJub curve.
 *  This is the format which should be passed into the PublicKey and other circuits.
 */
function formatPrivKeyForBabyJub(privKey, eddsa) {
    const sBuff = eddsa.pruneBuffer((0, blake_hash_1.default)("blake512").update(Buffer.from(privKey)).digest().slice(0, 32));
    const s = ffjavascript_1.utils.leBuff2int(sBuff);
    return ffjavascript_1.Scalar.shr(s, 3);
}
exports.formatPrivKeyForBabyJub = formatPrivKeyForBabyJub;
