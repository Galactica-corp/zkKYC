"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateZKKYCInput = exports.fields = void 0;
const circomlibjs_1 = require("circomlibjs");
const zkCertificate_1 = require("../lib/zkCertificate");
const keyManagement_1 = require("../lib/keyManagement");
const merkleTree_1 = require("../lib/merkleTree");
const hardhat_1 = require("hardhat");
const fs_1 = __importDefault(require("fs"));
const lib_1 = require("../lib");
// sample field inputs
exports.fields = {
    surname: '23742384',
    forename: '23234234',
    middlename: '12233937',
    yearOfBirth: 1982,
    monthOfBirth: 5,
    dayOfBirth: 28,
    verificationLevel: '1',
    expirationDate: 1769736098,
    streetAndNumber: '23423453234234',
    postcode: '23423453234234',
    town: '23423453234234',
    region: '23423453234234',
    country: '23423453234234',
    citizenship: '23423453234234',
    passportID: '3095472098',
};
async function generateZKKYCInput() {
    // and eddsa instance for signing
    const eddsa = await (0, circomlibjs_1.buildEddsa)();
    // input
    // you can change the holder to another address, the script just needs to be able to sign a message with it
    const [holder, user, encryptionAccount, institution, KYCProvider] = await hardhat_1.ethers.getSigners();
    const holderEdDSAKey = await (0, keyManagement_1.getEddsaKeyFromEthSigner)(holder);
    const holderCommitment = (0, keyManagement_1.createHolderCommitment)(eddsa, holderEdDSAKey);
    // TODO: create ZkKYC subclass requiring all the other fields
    let zkKYC = new zkCertificate_1.ZKCertificate(holderCommitment, lib_1.ZkCertStandard.zkKYC, eddsa, 1773);
    // create json output file for ownership test
    let ownershipProofInput = zkKYC.getOwnershipProofInput(holderEdDSAKey);
    let authorizationProofInput = zkKYC.getAuthorizationProofInput(holderEdDSAKey, user.address);
    const currentTimestamp = Math.floor(Date.now() / 1000) + 10000;
    // set the fields in zkKYC object
    zkKYC.setFields(exports.fields);
    //construct the zkKYC inputs
    let zkKYCInput = { ...exports.fields };
    // some default provider private key
    // providerData needs to be created before leafHash computation
    const providerEdDSAKey = await (0, keyManagement_1.getEddsaKeyFromEthSigner)(KYCProvider);
    const providerData = zkKYC.getProviderData(providerEdDSAKey);
    zkKYCInput.providerAx = providerData.Ax;
    zkKYCInput.providerAy = providerData.Ay;
    zkKYCInput.providerS = providerData.S;
    zkKYCInput.providerR8x = providerData.R8x;
    zkKYCInput.providerR8y = providerData.R8y;
    // calculate zkKYC leaf hash
    let leafHash = zkKYC.leafHash;
    let encryptionPrivKey = BigInt(await (0, keyManagement_1.getEddsaKeyFromEthSigner)(encryptionAccount)).toString();
    let institutionPrivKey = BigInt(await (0, keyManagement_1.getEddsaKeyFromEthSigner)(institution)).toString();
    let institutionPub = eddsa.prv2pub(institutionPrivKey);
    let fraudInvestigationDataEncryptionProofInput = await zkKYC.getFraudInvestigationDataEncryptionProofInput(institutionPub, encryptionPrivKey);
    //placeholder for now, later on we need to be able to change it to deployed dApp address on-chain
    // probably the generateZKKYCInput will need to read inputs from a json file
    let dAppAddress = '2093684589645';
    let humanIDProofInput = zkKYC.getHumanIDProofInput(dAppAddress, exports.fields.passportID);
    // initiate an empty merkle tree
    let merkleTree = new merkleTree_1.MerkleTree(32, eddsa.poseidon);
    // add leaf hash as a leaf to this merkle tree
    merkleTree.insertleaves([leafHash]);
    let merkleRoot = merkleTree.root;
    let merkleProof = merkleTree.createProof(leafHash);
    // general zkCert fields
    zkKYCInput.holderCommitment = zkKYC.holderCommitment;
    zkKYCInput.randomSalt = zkKYC.randomSalt;
    zkKYCInput.pathElements = merkleProof.path;
    zkKYCInput.pathIndices = merkleProof.pathIndices;
    zkKYCInput.root = merkleRoot;
    zkKYCInput.currentTime = currentTimestamp;
    // add ownership proof inputs
    zkKYCInput.Ax = ownershipProofInput.Ax;
    zkKYCInput.Ay = ownershipProofInput.Ay;
    zkKYCInput.S = ownershipProofInput.S;
    zkKYCInput.R8x = ownershipProofInput.R8x;
    zkKYCInput.R8y = ownershipProofInput.R8y;
    // add authorization proof inputs
    zkKYCInput.userAddress = authorizationProofInput.userAddress;
    zkKYCInput.S2 = authorizationProofInput.S;
    zkKYCInput.R8x2 = authorizationProofInput.R8x;
    zkKYCInput.R8y2 = authorizationProofInput.R8y;
    // add fraud investigation data
    zkKYCInput.userPrivKey =
        fraudInvestigationDataEncryptionProofInput.userPrivKey;
    zkKYCInput.investigationInstitutionPubKey =
        fraudInvestigationDataEncryptionProofInput.investigationInstitutionPubkey;
    // add humanID data
    zkKYCInput.dAppAddress = humanIDProofInput.dAppAddress;
    zkKYCInput.humanID = humanIDProofInput.humanID;
    return zkKYCInput;
}
exports.generateZKKYCInput = generateZKKYCInput;
/**
 * @description Script for creating proof input for a zkKYC certificate
 */
async function main() {
    const zkKYCInput = await generateZKKYCInput();
    fs_1.default.writeFileSync('./circuits/input/zkKYC.json', JSON.stringify(zkKYCInput, null, 2), 'utf8');
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
