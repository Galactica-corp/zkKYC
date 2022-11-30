"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZKCertificate = void 0;
const ffjavascript_1 = require("ffjavascript");
const keyManagement_1 = require("./keyManagement");
const helpers_1 = require("./helpers");
/**
 * @description Class for managing and constructing zkCertificates, the generalized version of zkKYC.
 * @dev specification can be found here: https://docs.google.com/document/d/16R_CI7oj-OqRoIm6Ipo9vEpUQmgaVv7fL2yI4NTX9qw/edit?pli=1#heading=h.ah3xat5fhvac
 */
class ZKCertificate {
    /**
     * @description Create a ZKCertificate
     *
     * @param holderKey EdDSA Private key of the holder. Used to derive pubkey and sign holder commitment.
     *   TODO: move private key out of this class into Metamaks callback or something similar
     * @param poseidon Poseidon instance to use for hashing
     *
     * @param fields ZKCertificate parameters, can be set later
     */
    constructor(holderKey, poseidon, eddsa, fields = {}) {
        this.holderKey = holderKey;
        this.poseidon = poseidon;
        this.eddsa = eddsa;
        this.fields = fields;
        this.poseidon = poseidon;
        this.eddsa = eddsa;
        this.fieldPoseidon = poseidon.F;
        this.holderPubKeyEddsa = this.eddsa.prv2pub(holderKey);
        this.holderCommitment = this.createHolderCommitment(holderKey);
        this.fields = fields;
    }
    get leafHash() {
        return this.poseidon.F.toObject(this.poseidon(helpers_1.zkCertificateFieldOrder.map((field) => this.fields[field]), undefined, 1)).toString();
    }
    setFields(fields) {
        this.fields = fields;
    }
    /**
     * @description Create the input for the ownership proof of this zkCert
     *
     * @param holderKey EdDSA Private key of the holder
     * @returns OwnershipProofInput struct
     */
    getOwnershipProofInput(holderKey) {
        const hashPubkey = this.fieldPoseidon.toObject(this.poseidon([this.holderPubKeyEddsa[0], this.holderPubKeyEddsa[1]]));
        // take modulo of hash to get it into the mod field supported by eddsa
        const hashPubkeyMsg = this.fieldPoseidon.e(ffjavascript_1.Scalar.mod(hashPubkey, keyManagement_1.eddsaPrimeFieldMod));
        const sig = this.eddsa.signPoseidon(holderKey, hashPubkeyMsg);
        // selfcheck
        if (!this.eddsa.verifyPoseidon(hashPubkeyMsg, sig, this.holderPubKeyEddsa)) {
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
     * @description Create the input for the authorization proof of this zkCert
     *
     * @param holderKey EdDSA Private key of the holder
     * @param userAddress user address to be signed
     * @returns AuthorizationProofInput struct
     */
    getAuthorizationProofInput(holderKey, userAddress) {
        // we include the 0x prefix so the address has length 42 in hexadecimal
        if (userAddress.length !== 42) {
            throw new Error('Incorrect address length');
        }
        // we don't need to hash the user address because of the length making it less than 2**160, hence less than the field prime value.
        const userAddress_ = this.fieldPoseidon.e(userAddress);
        const sig = this.eddsa.signPoseidon(holderKey, userAddress_);
        // selfcheck
        if (!this.eddsa.verifyPoseidon(userAddress, sig, this.holderPubKeyEddsa)) {
            throw new Error('Self check on EdDSA signature failed');
        }
        return {
            userAddress: userAddress,
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
    createHolderCommitment(privateKey) {
        // get pubKey hash and signature from ownership proof (holderCommitment might not be set yet)
        const ownershipProof = this.getOwnershipProofInput(privateKey);
        return this.fieldPoseidon
            .toObject(this.poseidon([
            ownershipProof.S,
            ownershipProof.R8x,
            ownershipProof.R8y,
        ]))
            .toString();
    }
}
exports.ZKCertificate = ZKCertificate;
