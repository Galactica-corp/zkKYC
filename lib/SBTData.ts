import { ethers } from 'hardhat';
import { generateEcdhSharedKey } from './keyManagement';
import { buildEddsa } from 'circomlibjs';
import { buildMimcSponge } from '../../lib/mimcEncrypt';

/**
 * @description Generates encrypted data for fraud investigation
 *
 * @param galaInstitutionPubKey: public
 * @param userPrivKey: encryption key derived from user private key
 * @param providerPubKey: the provider pubkey contains 2 uint256, but we only take the first one, it is enough for identification
 * @param zkCertHash:
 * @return encryptedData
 */
export async function calculateEncryptedData(
  galaInstitutionPubKey: ,
  userPrivKey: BigInt,
  providerPubKey,
  zkCertHash
) {
  const eddsa = await buildEddsa();
  const sharedKey = generateEcdhSharedKey(
    userPrivKey,
    galaInstitutionPubKey,
    eddsa
  );
  const mimcjs = await buildMimcSponge();
    const result = mimcjs.encrypt(providerPubKey, zkCertHash, sharedKey[0]);
    return result.map((p: any) => eddsa.poseidon.F.toObject(p).toString()
}
export async function getEddsaKeyFromEthSigner(
  signer: SignerWithAddress
): Promise<string> {
  return signer.signMessage(eddsaKeyGenerationMessage);
}
async function main() {
  const [sender, receiver] = await ethers.getSigners();

  const senderPriv = BigInt(await getEddsaKeyFromEthSigner(sender)).toString();
  const receiverPriv = BigInt(
    await getEddsaKeyFromEthSigner(receiver)
  ).toString();
  console.log(senderPriv);
  console.log(receiverPriv);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
