"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptFraudInvestigationData = exports.encryptFraudInvestigationData = void 0;
const keyManagement_1 = require("./keyManagement");
const circomlibjs_1 = require("circomlibjs");
const mimcEncrypt_1 = require("./mimcEncrypt");
/**
 * @description Generates encrypted data for fraud investigation
 *
 * @param galaInstitutionPubKey: public
 * @param userPrivKey: encryption key derived from user private key
 * @param providerPubKey: the provider pubkey contains 2 uint256, but we only take the first one, it is enough for identification
 * @param zkCertHash:
 * @return encryptedData
 */
async function encryptFraudInvestigationData(galaInstitutionPub, userPrivKey, providerPubKey, zkCertHash) {
    const eddsa = await (0, circomlibjs_1.buildEddsa)();
    const sharedKey = (0, keyManagement_1.generateEcdhSharedKey)(userPrivKey, galaInstitutionPub, eddsa);
    const mimcjs = await (0, mimcEncrypt_1.buildMimcSponge)();
    const result = mimcjs.encrypt(providerPubKey, zkCertHash, sharedKey[0]);
    return [
        eddsa.poseidon.F.toObject(result.xL).toString(),
        eddsa.poseidon.F.toObject(result.xR).toString(),
    ];
}
exports.encryptFraudInvestigationData = encryptFraudInvestigationData;
async function decryptFraudInvestigationData(galaInstitutionPrivKey, userPubKey, encryptedData) {
    const eddsa = await (0, circomlibjs_1.buildEddsa)();
    const sharedKey = (0, keyManagement_1.generateEcdhSharedKey)(galaInstitutionPrivKey, userPubKey, eddsa);
    const mimcjs = await (0, mimcEncrypt_1.buildMimcSponge)();
    const result = mimcjs.decrypt(encryptedData[0], encryptedData[1], sharedKey[0]);
    return [
        eddsa.poseidon.F.toObject(result.xL).toString(),
        eddsa.poseidon.F.toObject(result.xR).toString(),
    ];
}
exports.decryptFraudInvestigationData = decryptFraudInvestigationData;
