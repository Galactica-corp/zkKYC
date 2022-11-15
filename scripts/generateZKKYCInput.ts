import { buildEddsa } from 'circomlibjs';
import { ZKCertificate } from '../lib/zkCertificate';
import { getEddsaKeyFromEthSigner } from '../lib/keyManagement';
import { MerkleTree } from '../lib/merkleTree';
import { ethers } from 'hardhat';

/**
 * @description Script for creating a zkKYC certificate
 */
async function main() {
  // and eddsa instance for signing
  const eddsa = await buildEddsa();

  // input
  // you can change the holder to another address, the script just needs to be able to sign a message with it
  const [holder, user] = await ethers.getSigners();

  const holderEdDSAKey = await getEddsaKeyFromEthSigner(holder);
  // TODO: create ZkKYC subclass requiring all the other fields
  let zkKYC = new ZKCertificate(holderEdDSAKey, eddsa.poseidon, eddsa);

  // create json output file for ownership test
  let ownershipProofInput = zkKYC.getOwnershipProofInput(holderEdDSAKey);
  let authorizationProofInput = zkKYC.getAuthorizationProofInput(
    holderEdDSAKey,
    user.address
  );

  // sample field inputs
  let fields = {
    surname: '23742384',
    forename: '23234234',
    middlename: '12233937',
    yearOfBirth: 1982,
    monthOfBirth: 5,
    dayOfBirth: 28,
    verificationLevel: '1',
    expirationDate: 1669736098,
    holderCommitment: zkKYC.holderCommitment,
    providerSignature: '0xd52eD52d3C37b7f62b13dC2a613D3e99bDC47602',
    randomSalt: '1773',
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
  let zkKYCInput = { ...fields };

  zkKYCInput.pathElements = merkleProof.path;
  zkKYCInput.pathIndices = merkleProof.pathIndices;
  zkKYCInput.root = merkleRoot;
  zkKYCInput.currentTime = zkKYCInput.expirationDate - 10;

  // add ownership proof inputs
  zkKYCInput.Ax = ownershipProofInput.Ax;
  zkKYCInput.Ay = ownershipProofInput.Ay;
  zkKYCInput.S = ownershipProofInput.S;
  zkKYCInput.R8x = ownershipProofInput.R8y;
  zkKYCInput.R8y = ownershipProofInput.R8y;

  // add authorization proof inputs

  zkKYCInput.S2 = authorizationProofInput.S;
  zkKYCInput.R8x2 = authorizationProofInput.R8x;
  zkKYCInput.R8y2 = authorizationProofInput.R8y;

  console.log(zkKYCInput);
}

/* 

    // verify that tx sender is authorized to use the proof
    // user address as message to be signed, this will be a public input so the SC can compare it with the onchain message sender
    signal input userAddress;
    // EdDSA signature of the user address
    signal input S2;
    signal input R8x2;
    signal input R8y2; */

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
