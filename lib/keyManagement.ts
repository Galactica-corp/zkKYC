import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

/**
 * @description Generates the eddsa private key from the ethereum private key signing a fixed message
 * 
 * @param signer Ethers signer
 */
export async function getEddsaKeyFromEthSigner(signer: SignerWithAddress): Promise<string> {
  return signer.signMessage(eddsaKeyGenerationMessage);
}

export const eddsaKeyGenerationMessage = "Signing this message generates your EdDSA private key. Only do this on pages you trust to manage your zkCertificates.";
