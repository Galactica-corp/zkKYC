"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const circomlibjs_1 = require("circomlibjs");
const zkCertificate_1 = require("../lib/zkCertificate");
const keyManagement_1 = require("../lib/keyManagement");
const config_1 = require("hardhat/config");
const argumentTypes_1 = require("hardhat/internal/core/params/argumentTypes");
const lib_1 = require("../lib");
/**
 * @description Script for creating a zkKYC certificate
 */
async function main(args, hre) {
    console.log("Creating zkKYC certificate");
    const [provider] = await hre.ethers.getSigners();
    console.log(`Using provider ${provider.address} to sign the zkKYC certificate`);
    console.log("holderCommitment", args.holderCommitment);
    console.log("randomSalt", args.randomSalt);
    console.log(`reading KYC data from ${args.kycDataFile}`);
    let data = JSON.parse(fs_1.default.readFileSync(args.kycDataFile, 'utf-8'));
    console.log("input data", data);
    const eddsa = await (0, circomlibjs_1.buildEddsa)();
    //verify that all the fields are present
    const exceptions = [
        "holderCommitment",
        // "providerSignature", // TODO: add provider signature properly
    ];
    const stringFieldsForHashing = [
        "surname",
        "forename",
        "middlename",
        "streetAndNumber",
        "postcode",
        "town",
        "region",
        "country",
        "citizenship",
        "passportID",
    ];
    const zkKYCFields = {};
    for (let field of lib_1.zkKYCContentFields.filter((field) => !exceptions.includes(field))) {
        if (data[field] === undefined) {
            throw new Error(`Field ${field} missing in KYC data`);
        }
        if (stringFieldsForHashing.includes(field)) {
            // hashing string data so that it fits into the field used by the circuit
            zkKYCFields[field] = (0, lib_1.hashStringToFieldNumber)(data[field], eddsa.poseidon);
        }
        else {
            zkKYCFields[field] = data[field];
        }
    }
    // TODO: create ZkKYC subclass requiring all the other fields
    let zkKYC = new zkCertificate_1.ZKCertificate(args.holderCommitment, lib_1.ZkCertStandard.zkKYC, eddsa, args.randomSalt, zkKYCFields);
    // let provider sign the zkKYC
    const providerEdDSAKey = await (0, keyManagement_1.getEddsaKeyFromEthSigner)(provider);
    zkKYC.signWithProvider(providerEdDSAKey);
    console.log("zkKYC", zkKYC.exportJson());
    console.log("done");
}
(0, config_1.task)("createZkKYC", "Task to create a zkKYC certificate with input parameters")
    .addParam("holderCommitment", "The holder commitment fixing the address of the holder without disclosing it to the provider", undefined, argumentTypes_1.string, false)
    .addParam("randomSalt", "Random salt to input into zkCert hashing", 0, config_1.types.int, true)
    .addParam("kycDataFile", "The file containing the KYC data", undefined, config_1.types.string, false)
    .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre).catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
});
