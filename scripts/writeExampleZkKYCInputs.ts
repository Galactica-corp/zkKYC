import fs from 'fs';
import { generateZKKYCInput } from './generateZKKYCInput';

/**
 * @description Script for creating proof input for a zkKYC certificate
 */
async function main() {
  const zkKYCInput = await generateZKKYCInput();

  fs.writeFileSync(
    './circuits/input/zkKYC.json',
    JSON.stringify(zkKYCInput, null, 2),
    'utf8'
  );

  // also create example for ageProofZkKYC
  const ageProofZkKYCInput = {
    ...zkKYCInput,
    yearOfBirth: 1969,
    monthOfBirth: 5,
    dayOfBirth: 7,
    ageThreshold: 18,
  };

  fs.writeFileSync(
    './circuits/input/ageProofZkKYC.json',
    JSON.stringify(ageProofZkKYCInput, null, 2),
    'utf8'
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
