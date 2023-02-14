"use strict";
/**
 * SNARK efficient encryption and decryption with mimc in sponge mode.
 * Merged circomlibjs with version from https://github.com/iden3/circomlib/pull/16
 *
 * TODO: This should be audited before using in production with real user data.
 * The MimcEncrypt only encrypts a single field element. If we need to encrypt more
 *  it might make sense in the future to take a look at Poseidon encryption:
 *  - spec: https://drive.google.com/file/d/1EVrP3DzoGbmzkRmYnyEDcIQcXVU7GlOd/view
 *  - implementation (not audited and not compatible as is): https://github.com/iden3/circomlib/pull/60
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimcEncrypt = exports.buildMimcSponge = void 0;
const ffjavascript_1 = require("ffjavascript");
const ethers_1 = require("ethers");
const SEED = "mimcsponge";
const NROUNDS = 220;
async function buildMimcSponge() {
    const bn128 = await (0, ffjavascript_1.getCurveFromName)("bn128", true);
    return new MimcEncrypt(bn128.Fr);
}
exports.buildMimcSponge = buildMimcSponge;
class MimcEncrypt {
    constructor(F) {
        this.F = F;
        this.cts = this.getConstants(SEED, NROUNDS);
    }
    getIV(seed) {
        const F = this.F;
        if (typeof seed === "undefined")
            seed = SEED;
        const c = ethers_1.utils.keccak256(ethers_1.utils.toUtf8Bytes(seed + "_iv"));
        const cn = ffjavascript_1.Scalar.e(c);
        const iv = cn.mod(F.p);
        return iv;
    }
    getConstants(seed, nRounds) {
        const F = this.F;
        if (typeof seed === "undefined")
            seed = SEED;
        if (typeof nRounds === "undefined")
            nRounds = NROUNDS;
        const cts = new Array(nRounds);
        let c = ethers_1.utils.keccak256(ethers_1.utils.toUtf8Bytes(SEED));
        ;
        for (let i = 1; i < nRounds; i++) {
            c = ethers_1.utils.keccak256(c);
            cts[i] = F.e(c);
        }
        cts[0] = F.e(0);
        cts[cts.length - 1] = F.e(0);
        return cts;
    }
    hash(_xL_in, _xR_in, _k) {
        return this.permutation(_xL_in, _xR_in, _k, false);
    }
    // The following is an implementation of MiMC in Feistel mode as introduced in
    // [1]: Albrecht, Martin, et al. "MiMC: Efficient encryption and cryptographic
    //      hashing with minimal multiplicative complexity." International 
    //      Conference on the Theory and Application of Cryptology and Information
    //      Security. Springer, Berlin, Heidelberg, 2016.
    permutation(_xL_in, _xR_in, _k, _rev) {
        const F = this.F;
        let xL = F.e(_xL_in);
        let xR = F.e(_xR_in);
        const k = F.e(_k);
        for (let i = 0; i < NROUNDS; i++) {
            // If we are in decryption mode, then we need to reverse the order of
            // round constants and also rerverse the round function application.
            const c = _rev ? this.cts[NROUNDS - 1 - i] : this.cts[i];
            const t = (i == 0) ? F.add(xL, k) : F.add(F.add(xL, k), c);
            const xR_tmp = F.e(xR);
            // The round function is computed once and then either applied to the
            // left side, which is the typical Feistel network swap, or to the
            // right side because there is no swap in the last round.
            // The round function is (xL+k+c)^5, which is then combined with xR.
            //                           ^ from §5.3 in [1]
            // F_r = 21888242871839275222246405745257275088548364400416034343698204186575808495617
            // gcd(5, F_r - 1) = 1
            const round = _rev ? F.sub(xR_tmp, F.exp(t, 5)) : F.add(xR_tmp, F.exp(t, 5));
            if (i < (NROUNDS - 1)) {
                xR = xL;
                xL = round;
            }
            else {
                xR = round;
            }
        }
        return {
            xL: xL,
            xR: xR,
        };
    }
    encrypt(_xL_in, _xR_in, _k) {
        return this.hash(_xL_in, _xR_in, _k);
    }
    decrypt(_xL_in, _xR_in, _k) {
        return this.permutation(_xL_in, _xR_in, _k, true);
    }
    multiHash(arr, key, numOutputs) {
        const F = this.F;
        if (typeof (numOutputs) === "undefined") {
            numOutputs = 1;
        }
        if (typeof (key) === "undefined") {
            key = F.zero;
        }
        let R = F.zero;
        let C = F.zero;
        for (let i = 0; i < arr.length; i++) {
            R = F.add(R, F.e(arr[i]));
            const S = this.hash(R, C, key);
            R = S.xL;
            C = S.xR;
        }
        let outputs = [R];
        for (let i = 1; i < numOutputs; i++) {
            const S = this.hash(R, C, key);
            R = S.xL;
            C = S.xR;
            outputs.push(R);
        }
        if (numOutputs == 1) {
            return outputs[0];
        }
        else {
            return outputs;
        }
    }
}
exports.MimcEncrypt = MimcEncrypt;
