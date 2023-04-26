"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZKCertificate = void 0;
const ffjavascript_1 = require("ffjavascript");
const keyManagement_1 = require("./keyManagement");
const zkCertStandards_1 = require("./zkCertStandards");
const SBTData_1 = require("./SBTData");
const circomlibjs_1 = require("circomlibjs");
/**
 * @description Class for managing and constructing zkCertificates, the generalized version of zkKYC.
 * @dev specification can be found here: https://docs.google.com/document/d/16R_CI7oj-OqRoIm6Ipo9vEpUQmgaVv7fL2yI4NTX9qw/edit?pli=1#heading=h.ah3xat5fhvac
 */
class ZKCertificate {
    // fields of zkCert
    /**
     * @description Create a ZKCertificate
     *
     * @param holderCommitment commitment fixing the holder eddsa key without revealing it to the provider
     * @param zkCertStandard zkCert standard to use
     * @param eddsa eddsa instance to use for signing
     * @param randomSalt random salt randomizing the zkCert
     * @param fields ZKCertificate parameters, can be set later
     * @param providerData provider data, can be set later
     *
     * @param fields ZKCertificate parameters, can be set later
     */
    constructor(holderCommitment, zkCertStandard, // TODO: move enum from snap here
    eddsa, randomSalt, fields = {}, // standardize field definitions
    providerData = {
        Ax: '0',
        Ay: '0',
        S: '0',
        R8x: '0',
        R8y: '0',
    }) {
        this.holderCommitment = holderCommitment;
        this.zkCertStandard = zkCertStandard;
        this.eddsa = eddsa;
        this.randomSalt = randomSalt;
        this.fields = fields;
        this.providerData = providerData;
        this.poseidon = eddsa.poseidon;
        this.fieldPoseidon = this.poseidon.F;
    }
    get contentHash() {
        return this.poseidon.F.toObject(this.poseidon(zkCertStandards_1.zkKYCContentFields.map((field) => this.fields[field]), undefined, 1)).toString();
    }
    get leafHash() {
        return this.poseidon.F.toObject(this.poseidon([
            this.contentHash,
            this.providerData.Ax,
            this.providerData.Ay,
            this.providerData.S,
            this.providerData.R8x,
            this.providerData.R8y,
            this.holderCommitment,
            this.randomSalt,
        ], undefined, 1)).toString();
    }
    get providerMessage() {
        return this.poseidon.F.toObject(this.poseidon([this.contentHash, this.holderCommitment], undefined, 1)).toString();
    }
    get did() {
        return `did:${this.zkCertStandard}:${this.leafHash}`;
    }
    setFields(fields) {
        this.fields = fields;
    }
    /**
     * Export the zkCert as a JSON string that can be imported in the Galactica Snap for Metamask
     * TODO: add encryption option
     * @returns JSON string
     */
    exportJson() {
        const doc = {
            holderCommitment: this.holderCommitment,
            leafHash: this.leafHash,
            did: this.did,
            zkCertStandard: this.zkCertStandard,
            content: this.fields,
            providerData: this.providerData,
            randomSalt: this.randomSalt,
        };
        return JSON.stringify(doc, null, 2);
    }
    /**
     * @description Create the input for the ownership proof of this zkCert
     *
     * @param holderKey EdDSA Private key of the holder
     * @returns OwnershipProofInput struct
     */
    getOwnershipProofInput(holderKey) {
        const holderPubKeyEddsa = this.eddsa.prv2pub(holderKey);
        const hashPubkey = this.fieldPoseidon.toObject(this.poseidon([holderPubKeyEddsa[0], holderPubKeyEddsa[1]]));
        // take modulo of hash to get it into the mod field supported by eddsa
        const hashPubkeyMsg = this.fieldPoseidon.e(ffjavascript_1.Scalar.mod(hashPubkey, keyManagement_1.eddsaPrimeFieldMod));
        const sig = this.eddsa.signPoseidon(holderKey, hashPubkeyMsg);
        // selfcheck
        if (!this.eddsa.verifyPoseidon(hashPubkeyMsg, sig, holderPubKeyEddsa)) {
            throw new Error('Self check on EdDSA signature failed');
        }
        return {
            holderCommitment: this.holderCommitment,
            // public key of the holder
            Ax: this.fieldPoseidon.toObject(holderPubKeyEddsa[0]).toString(),
            Ay: this.fieldPoseidon.toObject(holderPubKeyEddsa[1]).toString(),
            // signature of the holder
            S: sig.S.toString(),
            R8x: this.fieldPoseidon.toObject(sig.R8[0]).toString(),
            R8y: this.fieldPoseidon.toObject(sig.R8[1]).toString(),
        };
    }
    /**
     * @description Create the input for the provider signature check of this zkCert
     *
     * @param providerKey EdDSA Private key of the KYC provider
     * @returns ProviderData struct
     */
    signWithProvider(providerKey) {
        const providerPubKeyEddsa = this.eddsa.prv2pub(providerKey);
        const message = this.fieldPoseidon.toObject(this.poseidon([this.contentHash, this.holderCommitment]));
        // take modulo of the message to get it into the mod field supported by eddsa
        const messageMod = this.fieldPoseidon.e(ffjavascript_1.Scalar.mod(message, keyManagement_1.eddsaPrimeFieldMod));
        const sig = this.eddsa.signPoseidon(providerKey, messageMod);
        // selfcheck
        if (!this.eddsa.verifyPoseidon(messageMod, sig, providerPubKeyEddsa)) {
            throw new Error('Self check on EdDSA signature failed');
        }
        this.providerData = {
            // public key of the provider
            Ax: this.fieldPoseidon.toObject(providerPubKeyEddsa[0]).toString(),
            Ay: this.fieldPoseidon.toObject(providerPubKeyEddsa[1]).toString(),
            // signature of the provider
            S: sig.S.toString(),
            R8x: this.fieldPoseidon.toObject(sig.R8[0]).toString(),
            R8y: this.fieldPoseidon.toObject(sig.R8[1]).toString(),
        };
        return this.providerData;
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
        const holderPubKeyEddsa = this.eddsa.prv2pub(holderKey);
        if (!this.eddsa.verifyPoseidon(userAddress, sig, holderPubKeyEddsa)) {
            throw new Error('Self check on EdDSA signature failed');
        }
        return {
            userAddress: userAddress,
            // public key of the holder
            Ax: this.fieldPoseidon.toObject(holderPubKeyEddsa[0]).toString(),
            Ay: this.fieldPoseidon.toObject(holderPubKeyEddsa[1]).toString(),
            // signature of the holder
            S: sig.S.toString(),
            R8x: this.fieldPoseidon.toObject(sig.R8[0]).toString(),
            R8y: this.fieldPoseidon.toObject(sig.R8[1]).toString(),
        };
    }
    /**
     * @description Create the input for the fraud investigation data encryption proof of this zkCert
     *
     * @param galaInstitutionPubKey
     * @param userPrivKey
     * @param providerPubKey
     * @param zkCertHash
     * @returns
     */
    async getFraudInvestigationDataEncryptionProofInput(institutionPub, userPrivKey) {
        const eddsa = await (0, circomlibjs_1.buildEddsa)();
        const userPub = eddsa.prv2pub(userPrivKey);
        const institutionPubKey = institutionPub.map((p) => eddsa.poseidon.F.toObject(p).toString());
        return {
            userPrivKey: (0, keyManagement_1.formatPrivKeyForBabyJub)(userPrivKey, eddsa).toString(),
            userPubKey: userPub.map((p) => eddsa.poseidon.F.toObject(p).toString()),
            investigationInstitutionPubkey: institutionPubKey,
            encryptedData: await (0, SBTData_1.encryptFraudInvestigationData)(institutionPub, userPrivKey, this.providerData.Ax, this.leafHash),
        };
    }
    /**
     * @description Calculate dApp specific human ID from zkKYC and dApp address.
     *
     * @param dAppAddress Address of the dApp.
     * @returns Human ID as string.
     */
    getHumanID(dAppAddress) {
        return this.poseidon.F.toObject(this.poseidon(
        // fill needed fields from zkKYC with dAppAddress added at the correct place
        zkCertStandards_1.humanIDFieldOrder.map((field) => field == "dAppAddress" ? dAppAddress : this.fields[field]), undefined, 1)).toString();
    }
    getHumanIDProofInput(dAppAddress, passportID) {
        return {
            dAppAddress: dAppAddress,
            passportID: passportID,
            humanID: this.getHumanID(dAppAddress),
        };
    }
}
exports.ZKCertificate = ZKCertificate;
