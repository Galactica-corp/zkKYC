import { buildEddsa } from 'circomlibjs';
import { ZKCertificate } from '../lib/zkCertificate';
import { createHolderCommitment, getEddsaKeyFromEthSigner } from '../lib/keyManagement';
import { MerkleTree } from '../lib/merkleTree';
import { ethers } from 'hardhat';
import fs from 'fs';
import { ZkCertStandard } from '../lib';

export async function generateZKKYCInput() {
  // and eddsa instance for signing
  const eddsa = await buildEddsa();

  // input
  // you can change the holder to another address, the script just needs to be able to sign a message with it
  const [holder, user] = await ethers.getSigners();

  const holderEdDSAKey = await getEddsaKeyFromEthSigner(holder);
  const holderCommitment = createHolderCommitment(eddsa, holderEdDSAKey);
  // TODO: create ZkKYC subclass requiring all the other fields
  let zkKYC = new ZKCertificate(holderCommitment, ZkCertStandard.zkKYC, eddsa, 1773);

  // create json output file for ownership test
  let ownershipProofInput = zkKYC.getOwnershipProofInput(holderEdDSAKey);
  let authorizationProofInput = zkKYC.getAuthorizationProofInput(
    holderEdDSAKey,
    user.address
  );
  
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // sample field inputs
  let fields = {
    surname: '23742384',
    forename: '23234234',
    middlename: '12233937',
    yearOfBirth: 1982,
    monthOfBirth: 5,
    dayOfBirth: 28,
    verificationLevel: '1',
    expirationDate: 1769736098,
    holderCommitment: zkKYC.holderCommitment,
    streetAndNumber: '23423453234234',
    postcode: '23423453234234',
    town: '23423453234234',
    region: '23423453234234',
    country: '23423453234234',
  };

  // set the fields in zkKYC object
  zkKYC.setFields(fields);

  // calculate zkKYC leaf hash
  let leafHash = zkKYC.leafHash;

  // initiate an empty merkle tree
  let merkleTree = new MerkleTree(32, eddsa.poseidon);

  // add leaf hash as a leaf to this merkle tree
  merkleTree.insertleaves([leafHash]);

  let merkleRoot = merkleTree.root;

  let merkleProof = merkleTree.createProof(leafHash);

  //construct the zkKYC inputs
  let zkKYCInput: any = { ...fields };

  // general zkCert fields
  zkKYCInput.holderCommitment = zkKYC.holderCommitment;
  zkKYCInput.randomSalt = zkKYC.randomSalt;
  zkKYCInput.providerAx = zkKYC.providerData.Ax;
  zkKYCInput.providerAy = zkKYC.providerData.Ay;
  zkKYCInput.providerS = zkKYC.providerData.S;
  zkKYCInput.providerR8x = zkKYC.providerData.R8x;
  zkKYCInput.providerR8y = zkKYC.providerData.R8y;

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

  return zkKYCInput;
}


/**
 * @description Script for creating proof input for a zkKYC certificate
 */
async function main() {
  const zkKYCInput = await generateZKKYCInput();

  fs.writeFileSync(
    './circuits/input/zkKYC.json',
    JSON.stringify(zkKYCInput, null, 2),
    'utf8'
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
