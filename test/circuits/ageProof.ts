import { assert, expect } from 'chai';
import { readFileSync } from 'fs';
import hre from 'hardhat';
import { CircuitTestUtils } from 'hardhat-circom';

describe('Age Proof Circuit Component', () => {
  let circuit: CircuitTestUtils;

  const sampleInput = JSON.parse(
    readFileSync('./circuits/input/ageProof.json', 'utf8')
  );

  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup('ageProof');
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

    assert.propertyVal(
      witness,
      'main.ageThreshold',
      sampleInput.ageThreshold.toString()
    );
    // check resulting root as output
    assert.propertyVal(witness, 'main.valid', '1');
  });

  it('the proof is not valid if current year is small', async () => {
    let forgedInput = { ...sampleInput };
    forgedInput.currentYear =
      forgedInput.yearOfBirth + forgedInput.ageThreshold - 1;
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.propertyVal(witness, 'main.valid', '0');
  });
  it('the proof is not valid if current month is small', async () => {
    let forgedInput = { ...sampleInput };
    forgedInput.currentYear =
      forgedInput.yearOfBirth + forgedInput.ageThreshold;
    forgedInput.currentDay = forgedInput.dayOfBirth;
    forgedInput.currentMonth = forgedInput.monthOfBirth - 1;
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.propertyVal(witness, 'main.valid', '0');
  });
  it('the proof is not valid if current day is small', async () => {
    let forgedInput = { ...sampleInput };
    forgedInput.currentYear =
      forgedInput.yearOfBirth + forgedInput.ageThreshold;
    forgedInput.currentDay = forgedInput.dayOfBirth - 1;
    forgedInput.currentMonth = forgedInput.monthOfBirth;
    const witness = await circuit.calculateLabeledWitness(
      forgedInput,
      sanityCheck
    );
    assert.propertyVal(witness, 'main.valid', '0');
  });
});
