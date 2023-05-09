/* Copyright (C) 2023 Galactica Network. This file is part of zkKYC. zkKYC is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. zkKYC is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. */
import { buildEddsa } from 'circomlibjs';
import { ZKCertificate } from '../lib/zkCertificate';
import {
  createHolderCommitment,
  getEddsaKeyFromEthSigner,
} from '../lib/keyManagement';
import { MerkleTree } from '../lib/merkleTree';
import { ethers } from 'hardhat';
import { ZkCertStandard } from '../lib';

// sample field inputs
export const fields = {
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

export async function generateZKKYCInput() {
  // and eddsa instance for signing
  const eddsa = await buildEddsa();

  // input
  // you can change the holder to another address, the script just needs to be able to sign a message with it
  const [holder, user, encryptionAccount, institution, KYCProvider] =
    await ethers.getSigners();

  const holderEdDSAKey = await getEddsaKeyFromEthSigner(holder);
  const holderCommitment = createHolderCommitment(eddsa, holderEdDSAKey);
  // TODO: create ZkKYC subclass requiring all the other fields
  let zkKYC = new ZKCertificate(
    holderCommitment,
    ZkCertStandard.zkKYC,
    eddsa,
    1773
  );

  // create json output file for ownership test
  let ownershipProofInput = zkKYC.getOwnershipProofInput(holderEdDSAKey);
  let authorizationProofInput = zkKYC.getAuthorizationProofInput(
    holderEdDSAKey,
    user.address
  );

  const currentTimestamp = Math.floor(Date.now() / 1000) + 10000;

  // set the fields in zkKYC object
  zkKYC.setFields(fields);

  //construct the zkKYC inputs
  let zkKYCInput: any = { ...fields };

  // some default provider private key
  // providerData needs to be created before leafHash computation
  const providerEdDSAKey = await getEddsaKeyFromEthSigner(KYCProvider);
  const providerData = zkKYC.signWithProvider(providerEdDSAKey);
  zkKYCInput.providerAx = providerData.Ax;
  zkKYCInput.providerAy = providerData.Ay;
  zkKYCInput.providerS = providerData.S;
  zkKYCInput.providerR8x = providerData.R8x;
  zkKYCInput.providerR8y = providerData.R8y;

  // calculate zkKYC leaf hash
  let leafHash = zkKYC.leafHash;

  let encryptionPrivKey = BigInt(
    await getEddsaKeyFromEthSigner(encryptionAccount)
  ).toString();
  let institutionPrivKey = BigInt(
    await getEddsaKeyFromEthSigner(institution)
  ).toString();
  let institutionPub = eddsa.prv2pub(institutionPrivKey);

  let fraudInvestigationDataEncryptionProofInput =
    await zkKYC.getFraudInvestigationDataEncryptionProofInput(
      institutionPub,
      encryptionPrivKey
    );

  //placeholder for now, later on we need to be able to change it to deployed dApp address on-chain
  // probably the generateZKKYCInput will need to read inputs from a json file
  let dAppAddress = '2093684589645';
  let humanIDProofInput = zkKYC.getHumanIDProofInput(dAppAddress, fields.passportID);

  // initiate an empty merkle tree
  let merkleTree = new MerkleTree(32, eddsa.poseidon);

  // add leaf hash as a leaf to this merkle tree
  merkleTree.insertLeaves([leafHash]);

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
