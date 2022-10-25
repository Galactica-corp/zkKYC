import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import createBlakeHash from "blake-hash";
import { Scalar, utils }  from "ffjavascript";



export const eddsaKeyGenerationMessage = "Signing this message generates your EdDSA private key. Only do this on pages you trust to manage your zkCertificates.";

export const eddsaPrimeFieldMod = "2736030358979909402780800718157159386076813972158567259200215660948447373040";

/**
 * @description Generates the eddsa private key from the ethereum private key signing a fixed message
 * 
 * @param signer Ethers signer
 * @return The eddsa private key.
 */
export async function getEddsaKeyFromEthSigner(signer: SignerWithAddress): Promise<string> {
  return signer.signMessage(eddsaKeyGenerationMessage);
}

/**
 * @description Generates an Elliptic-curve Diffie–Hellman shared key https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman
 *   It is symmetric and can be produced by both parties using their private key and the other party's public key.
 * 
 * @param privKey EdDSA private key of Alice
 * @param pubKey EdDSA public key of Bob
 * @param eddsa eddsa instance from circomlibjs
 * @return The ECDH shared key.
 */
 export function generateEcdhSharedKey(privKey: string, pubKey: string[], eddsa: any): BigInt {
  const keyBuffer = eddsa.babyJub.mulPointEscalar(pubKey, formatPrivKeyForBabyJub(privKey, eddsa))[0];
  return eddsa.F.toObject(keyBuffer);
}

/**
 * @description Format a random private key to be compatible with the BabyJub curve.
 *  This is the format which should be passed into the PublicKey and other circuits.
 */
export function formatPrivKeyForBabyJub(privKey: string, eddsa: any) {
  const sBuff = eddsa.pruneBuffer(
      createBlakeHash("blake512").update(
          Buffer.from(privKey),
      ).digest().slice(0,32)
  )
  const s = utils.leBuff2int(sBuff)
  return Scalar.shr(s, 3)
}
