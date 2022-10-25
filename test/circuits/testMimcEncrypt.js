const chai = require("chai");
const assert = chai.assert;

const buildMimcSponge = require('../../lib/mimcEncrypt').buildMimcSponge;

const hre = require("hardhat");
const utils = require("ethers").utils;
const readFileSync = require("fs").readFileSync;



describe.only("MiMC Sponge Encryption test", function () {
	const sanityCheck = true;

	describe("JS code", function () {
		let xL, xR, key, keyW;
		let mimcjs;
		let F;
	
		before(async () => {
			mimcjs = await buildMimcSponge();
			F = mimcjs.F;
	
			xL = F.e(utils.id("left").toString())
			xR = F.e(utils.id("right").toString())
			key = F.e(utils.id("key").toString())
			keyW = F.e(utils.id("keyW").toString())
		})
	
		it("Should encrypt and decrypt with same key", async () => {
			const ct = mimcjs.encrypt(xL, xR, key)
			const pt = mimcjs.decrypt(ct.xL, ct.xR, key)
			assert.equal(xL.toString(), pt.xL.toString())
			assert.equal(xR.toString(), pt.xR.toString())
		})
	
		it("Should fail to encrypt and decrypt with different keys", async () => {
			const ct = mimcjs.encrypt(xL, xR, key)
			const pt = mimcjs.decrypt(ct.xL, ct.xR, keyW)
			assert.notEqual(xL.toString(), pt.xL.toString())
			assert.notEqual(xR.toString(), pt.xR.toString())
		})
	});

	describe("Circuit Encrypt+Decrypt", function () {
		let circuit;
		let sampleInput;

		before(async () => {
			circuit = await hre.circuitTest.setup("mimcEnDecrypt");
			sampleInput = JSON.parse(
				readFileSync("./circuits/input/mimcEnDecrypt.json", "utf8")
			);
		});
	
		it("Should encrypt and decrypt a single message", async () => {
			const witness = await circuit.calculateLabeledWitness(
				sampleInput,
				sanityCheck
			);

			// check resulting root as output
			assert.propertyVal(witness, "main.xL_out", sampleInput["xL_in"]);
			assert.propertyVal(witness, "main.xR_out", sampleInput["xR_in"]);
		});
	
		it("Should fail decrypt with wrong key", async () => {
			wrongInput = sampleInput;
			wrongInput["k_two"] = "32547";
	
			const witness = await circuit.calculateLabeledWitness(
				wrongInput,
				sanityCheck
			);

			// check resulting root as output
			assert.notPropertyVal(witness, "main.xL_out", sampleInput["xL_in"]);
			assert.notPropertyVal(witness, "main.xR_out", sampleInput["xR_in"]);
		});
	});

	describe("Circuit Encrypt", function () {
		let circuit;
		let sampleInput;
		let xL, xR, key;
		let mimcjs;
		let F;
	
		before(async () => {
			// setup mimc circuit
			circuit = await hre.circuitTest.setup("mimcEncrypt");
			sampleInput = JSON.parse(
				readFileSync("./circuits/input/mimcEncrypt.json", "utf8")
			);

			// setup mimcjs
			mimcjs = await buildMimcSponge();
			F = mimcjs.F;
	
			xL = F.e(sampleInput["xL_in"].toString())
			xR = F.e(sampleInput["xR_in"].toString())
			key = F.e(sampleInput["k"].toString())
		});
	
		it("Should have the same result as mimc js", async () => {
			const witness = await circuit.calculateLabeledWitness(
				sampleInput,
				sanityCheck
			);

			const expected = mimcjs.encrypt(xL, xR, key)

			// check resulting root as output
			assert.propertyVal(witness, "main.xL_out", F.toObject(expected.xL).toString());
			assert.propertyVal(witness, "main.xR_out", F.toObject(expected.xR).toString());
		});
	});
});
