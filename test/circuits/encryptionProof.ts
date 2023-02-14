import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildEddsa } from 'circomlibjs';
import { ethers } from 'hardhat';

import {
  getEddsaKeyFromEthSigner,
  generateEcdhSharedKey,
  formatPrivKeyForBabyJub,
} from '../../lib/keyManagement';
import { buildMimcSponge } from '../../lib/mimcEncrypt';

describe('Encryption Proof', () => {
  let circuit: CircuitTestUtils;
  let eddsa: any;
  let mimcjs: any;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/encryptionProof.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('encryptionProof');
    eddsa = await buildEddsa();
    mimcjs = await buildMimcSponge();
  });

  it('produces a witness with valid constraints', async () => {
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.checkConstraints(witness);
  });

  it.only('generates unique shared ECDH key for sender and receiver', async () => {
    const [sender, receiver] = await ethers.getSigners();
    const msg = ['42', '69'];

    const senderPriv = BigInt(
      await getEddsaKeyFromEthSigner(sender)
    ).toString();
    const receiverPriv = BigInt(
      await getEddsaKeyFromEthSigner(receiver)
    ).toString();

    const senderPub = eddsa.prv2pub(senderPriv);
    const receiverPub = eddsa.prv2pub(receiverPriv);

    const sharedKey = generateEcdhSharedKey(senderPriv, receiverPub, eddsa);

    const circuitInputs = {
      senderPrivKey: formatPrivKeyForBabyJub(senderPriv, eddsa),
      senderPubKey: senderPub.map((p: any) =>
        eddsa.poseidon.F.toObject(p).toString()
      ),
      receiverPubKey: receiverPub.map((p: any) =>
        eddsa.poseidon.F.toObject(p).toString()
      ),
      msg: msg,
    };
    const witness = await circuit.calculateLabeledWitness(
      circuitInputs,
      sanityCheck
    );

    const expectedResult = mimcjs.encrypt(msg[0], msg[1], sharedKey[0]);
    console.log(expectedResult);
    console.log(eddsa.poseidon.F.toObject(expectedResult.xL).toString());

    assert.propertyVal(
      witness,
      'main.encryptedMsg[0]',
      eddsa.poseidon.F.toObject(expectedResult.xL).toString()
    );
    assert.propertyVal(
      witness,
      'main.encryptedMsg[1]',
      eddsa.poseidon.F.toObject(expectedResult.xR).toString()
    );
  });
});
