import { Scalar, utils }  from "ffjavascript";

/**
 * @description Class for managing and constructing zkCertificates, the generalized version of zkKYC.
 * @dev specification can be found here: https://docs.google.com/document/d/16R_CI7oj-OqRoIm6Ipo9vEpUQmgaVv7fL2yI4NTX9qw/edit?pli=1#heading=h.ah3xat5fhvac
 */
 export class ZKCertificate {

  // Field of the curve used by Poseidon
  protected fieldPoseidon : any;

  // fields of zkCert
  readonly holderCommitment : string;

  // the following properties are not part of the specification, just helpful to have them in memory
  public holderPubKeyEddsa : any;

  /**
   * @description Create a ZKCertificate
   * 
   * @param holderKey EdDSA Private key of the holder. Used to derive pubkey and sign holder commitment.
   *   TODO: move private key out of this class into Metamaks callback or something similar
   * @param poseidon Poseidon instance to use for hashing
   */
  constructor(private holderKey: string, protected poseidon: any, protected eddsa: any) {
      this.poseidon = poseidon;
      this.eddsa = eddsa;
      this.fieldPoseidon = poseidon.F;

      this.holderPubKeyEddsa = this.eddsa.prv2pub(holderKey);

      this.holderCommitment = this.createHolderCommitment(holderKey);
  }

  get leafHash() : string {
    throw new Error("To be implemented");
  }

  /**
   * @description Create the input for the ownership proof of this zkCert
   * 
   * @param holderKey EdDSA Private key of the holder
   * @returns OwnershipProofInput struct
   */
  public getOwnershipProofInput(holderKey: string) : OwnershipProofInput {
    const hashPubkey : BigInt = this.fieldPoseidon.toObject(this.poseidon(
      [this.holderPubKeyEddsa[0], this.holderPubKeyEddsa[1]]
    ));
    // take modulo of hash to get it into the mod field supported by eddsa
    // and convert it into a buffer for eddsa (as done in iden3's unit test; could not find a better way)
    // TODO: cross check with circom that the comparison into a little endian buffer is correct
    const hashPubkeyMsg = utils.leInt2Buff(Scalar.mod(hashPubkey, "2736030358979909402780800718157159386076813972158567259200215660948447373040"), 32);
    const sig = this.eddsa.signPoseidon(holderKey, hashPubkeyMsg);

    // TODO: verify that the following are really little endian buffers
    return {
      holderCommitment: this.holderCommitment,
      // public key of the holder
      Ax: utils.leBuff2int(this.holderPubKeyEddsa[0]).toString(),
      Ay: utils.leBuff2int(this.holderPubKeyEddsa[1]).toString(),
      // signature of the holder
      S: sig.S.toString(),
      R8x: utils.leBuff2int(sig.R8[0]).toString(),
      R8y: utils.leBuff2int(sig.R8[1]).toString(),
    }
  }

  /**
   * @description Create the holder commitment according to the spec to fix the ownership of the zkCert
   * @dev holder commitment = poseidon(sign_eddsa(poseidon(pubkey)))
   * 
   * @param privateKey EdDSA Private key of the holder
   * @returns holder commitment
   */
  private createHolderCommitment(privateKey: string) : string {
    // get pubKey hash and signature from ownership proof (holderCommitment might not be set yet)
    const ownershipProof = this.getOwnershipProofInput(privateKey);

    return this.fieldPoseidon.toObject(this.poseidon(
      [ownershipProof.S, ownershipProof.R8x[0], ownershipProof.R8y[1]]
    )).toString();
  }
}

export interface OwnershipProofInput {
  holderCommitment: string;
  // public key
  Ax: string;
  Ay: string;
  // signature
  S: string;
  R8x: string;
  R8y: string;
}
