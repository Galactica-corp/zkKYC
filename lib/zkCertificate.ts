import { Scalar, utils } from 'ffjavascript';

import { eddsaPrimeFieldMod } from './keyManagement';

/**
 * @description Class for managing and constructing zkCertificates, the generalized version of zkKYC.
 * @dev specification can be found here: https://docs.google.com/document/d/16R_CI7oj-OqRoIm6Ipo9vEpUQmgaVv7fL2yI4NTX9qw/edit?pli=1#heading=h.ah3xat5fhvac
 */
export class ZKCertificate {
  // Field of the curve used by Poseidon
  protected fieldPoseidon: any;

  // fields of zkCert
  readonly holderCommitment: string;

  // the following properties are not part of the specification, just helpful to have them in memory
  public holderPubKeyEddsa: any;

  /**
   * @description Create a ZKCertificate
   *
   * @param holderKey EdDSA Private key of the holder. Used to derive pubkey and sign holder commitment.
   *   TODO: move private key out of this class into Metamaks callback or something similar
   * @param poseidon Poseidon instance to use for hashing
   */
  constructor(
    private holderKey: string,
    protected poseidon: any,
    protected eddsa: any
  ) {
    this.poseidon = poseidon;
    this.eddsa = eddsa;
    this.fieldPoseidon = poseidon.F;

    this.holderPubKeyEddsa = this.eddsa.prv2pub(holderKey);

    this.holderCommitment = this.createHolderCommitment(holderKey);
  }

  get leafHash(): string {
    throw new Error('To be implemented');
  }

  /**
   * @description Create the input for the ownership proof of this zkCert
   *
   * @param holderKey EdDSA Private key of the holder
   * @returns OwnershipProofInput struct
   */
  public getOwnershipProofInput(holderKey: string): OwnershipProofInput {
    const hashPubkey: BigInt = this.fieldPoseidon.toObject(
      this.poseidon([this.holderPubKeyEddsa[0], this.holderPubKeyEddsa[1]])
    );
    // take modulo of hash to get it into the mod field supported by eddsa
    const hashPubkeyMsg = this.fieldPoseidon.e(
      Scalar.mod(hashPubkey, eddsaPrimeFieldMod)
    );
    const sig = this.eddsa.signPoseidon(holderKey, hashPubkeyMsg);

    // selfcheck
    if (
      !this.eddsa.verifyPoseidon(hashPubkeyMsg, sig, this.holderPubKeyEddsa)
    ) {
      throw new Error('Self check on EdDSA signature failed');
    }

    return {
      holderCommitment: this.holderCommitment,
      // public key of the holder
      Ax: this.fieldPoseidon.toObject(this.holderPubKeyEddsa[0]).toString(),
      Ay: this.fieldPoseidon.toObject(this.holderPubKeyEddsa[1]).toString(),
      // signature of the holder
      S: sig.S.toString(),
      R8x: this.fieldPoseidon.toObject(sig.R8[0]).toString(),
      R8y: this.fieldPoseidon.toObject(sig.R8[1]).toString(),
    };
  }

  /**
   * @description Create the input for the ownership proof of this zkCert
   *
   * @param holderKey EdDSA Private key of the holder
   * @param userAddress user address to be signed
   * @returns OwnershipProofInput struct, we use this interface because the holder commitment can be any message
   */
  public getAuthorizationProofInput(
    holderKey: string,
    userAddress: string
  ): OwnershipProofInput {
    // we omit the 0x prefix so the address has length 40 in hexadecimal
    if (userAddress.length !== 40) {
      throw new Error('Incorrect address length');
    }
    // we don't need to hash the user address because of the length making it less than 2**160, hence less than the field prime value.
    const sig = this.eddsa.signPoseidon(holderKey, userAddress);

    // selfcheck
    if (
      !this.eddsa.verifyPoseidon(userAddressMod, sig, this.holderPubKeyEddsa)
    ) {
      throw new Error('Self check on EdDSA signature failed');
    }

    return {
      holderCommitment: userAddress,
      // public key of the holder
      Ax: this.fieldPoseidon.toObject(this.holderPubKeyEddsa[0]).toString(),
      Ay: this.fieldPoseidon.toObject(this.holderPubKeyEddsa[1]).toString(),
      // signature of the holder
      S: sig.S.toString(),
      R8x: this.fieldPoseidon.toObject(sig.R8[0]).toString(),
      R8y: this.fieldPoseidon.toObject(sig.R8[1]).toString(),
    };
  }

  /**
   * @description Create the holder commitment according to the spec to fix the ownership of the zkCert
   * @dev holder commitment = poseidon(sign_eddsa(poseidon(pubkey)))
   *
   * @param privateKey EdDSA Private key of the holder
   * @returns holder commitment
   */
  private createHolderCommitment(privateKey: string): string {
    // get pubKey hash and signature from ownership proof (holderCommitment might not be set yet)
    const ownershipProof = this.getOwnershipProofInput(privateKey);

    return this.fieldPoseidon
      .toObject(
        this.poseidon([
          ownershipProof.S,
          ownershipProof.R8x,
          ownershipProof.R8y,
        ])
      )
      .toString();
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
