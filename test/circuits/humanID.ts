import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';
import { buildPoseidon } from "circomlibjs";

describe('HumanID Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/humanID.json', 'utf8')
  );
  const fieldOrder = [
    "surname",
    "forename",
    "middlename",
    "yearOfBirth",
    "monthOfBirth",
    "dayOfBirth",
    "passportID",
    "dAppID"
  ];
  let expectedID: string;

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('humanID');

    let poseidon = await buildPoseidon();
    expectedID = poseidon.F.toObject(poseidon(fieldOrder.map(field => sampleInput[field]), undefined, 1)).toString();
  });

  it('produces a witness with valid constraints', async () => {
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.checkConstraints(witness);
  });

  it('has expected witness values', async () => {
    const witness = await circuit.calculateLabeledWitness(
      sampleInput,
      sanityCheck
    );
    assert.propertyVal(witness, 'main.surname', '46465');
    assert.propertyVal(witness, 'main.yearOfBirth', '2022');
    assert.propertyVal(witness, 'main.passportID', '3095472098');
    assert.propertyVal(witness, 'main.dAppID', '2093684589645');
    // check resulting output
    assert.propertyVal(witness, 'main.humanID', expectedID);
  });

  it('has the id hashed correctly', async () => {
    const expected = { humanID: expectedID };
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.assertOut(witness, expected);
  });

  it('output changes on any difference', async () => {
    for (let field of fieldOrder) {
      let forgedInput = sampleInput;
      forgedInput[field] += 1;
      const witness = await circuit.calculateLabeledWitness(
        forgedInput,
        sanityCheck
      );
      assert.notPropertyVal(witness, 'main.humanID', expectedID);
    }
  });

  it.skip('TODO: test integration in zkKYC', async () => {});
});
