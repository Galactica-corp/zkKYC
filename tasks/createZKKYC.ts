/* Copyright (C) 2023 Galactica Network. This file is part of zkKYC. zkKYC is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. zkKYC is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. */
import fs from 'fs'
import { buildEddsa } from "circomlibjs";
import { ZKCertificate } from "../lib/zkCertificate";
import { getEddsaKeyFromEthSigner } from "../lib/keyManagement";

import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { string } from 'hardhat/internal/core/params/argumentTypes';
import { hashStringToFieldNumber, zkKYCContentFields, ZkCertStandard } from '../lib';



/**
 * @description Script for creating a zkKYC certificate
 */
async function main(args: any, hre: HardhatRuntimeEnvironment) {
    console.log("Creating zkKYC certificate");

    const [provider] = await hre.ethers.getSigners();
    console.log(`Using provider ${provider.address} to sign the zkKYC certificate`);

    console.log("holderCommitment", args.holderCommitment);
    console.log("randomSalt", args.randomSalt);

    console.log(`reading KYC data from ${args.kycDataFile}`);
    let data = JSON.parse(fs.readFileSync(args.kycDataFile, 'utf-8'))
    console.log("input data", data);

    const eddsa = await buildEddsa();

    //verify that all the fields are present
    const exceptions = [
      "holderCommitment",
      // "providerSignature", // TODO: add provider signature properly
    ];
    const stringFieldsForHashing = [ // TODO: standardize the definition of fields and which of those are hashed and read it from the standard instead of hardcoding it here
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
    const zkKYCFields: Record<string, any> = {};
    for (let field of zkKYCContentFields.filter((field) => !exceptions.includes(field))) {
      if (data[field] === undefined) {
        throw new Error(`Field ${field} missing in KYC data`);
      }
      if (stringFieldsForHashing.includes(field)) {
        // hashing string data so that it fits into the field used by the circuit
        zkKYCFields[field] = hashStringToFieldNumber(data[field], eddsa.poseidon);
      }
      else {
        zkKYCFields[field] = data[field];
      }
    }

    // TODO: create ZkKYC subclass requiring all the other fields
    let zkKYC = new ZKCertificate(args.holderCommitment, ZkCertStandard.zkKYC, eddsa, args.randomSalt, zkKYCFields);

    // let provider sign the zkKYC
    const providerEdDSAKey = await getEddsaKeyFromEthSigner(provider);
    zkKYC.signWithProvider(providerEdDSAKey);

    console.log("zkKYC", zkKYC.exportJson());

    console.log("done");
}
  
task("createZkKYC", "Task to create a zkKYC certificate with input parameters")
  .addParam("holderCommitment", "The holder commitment fixing the address of the holder without disclosing it to the provider", undefined, string, false)
  .addParam("randomSalt", "Random salt to input into zkCert hashing", 0, types.int, true)
  .addParam("kycDataFile", "The file containing the KYC data", undefined, types.string, false)
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre).catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
  });
  
