import hre from "hardhat";
import { overwriteArtifact } from "../lib/helpers";
import { poseidonContract } from 'circomlibjs';
import { deploySC } from '../lib/hardhatHelpers';

const log = console.log;


async function main() {
  // wallets
  const [ deployer ] = await hre.ethers.getSigners();
  log(`Using account ${deployer.address} to deploy contracts`);
  log(`Account balance: ${(await deployer.getBalance()).toString()}`);

  // get poseidon from library
  await overwriteArtifact(hre, 'PoseidonT3', poseidonContract.createCode(2));
  
  // deploying everything
  const poseidonT3 = await deploySC('PoseidonT3', false);
  const centerRegistry = await deploySC('KYCCenterRegistry', true);
  const recordRegistry = await deploySC(
    'KYCRecordRegistryTest',
    true,
    {
      libraries: {
        PoseidonT3: poseidonT3.address,
      },
    },
    [centerRegistry.address]
  );
  const ageProofZkKYCVerifier = await deploySC('AgeProofZkKYCVerifier', true);
  const galacticaInstitution = await deploySC('MockGalacticaInstitution', true);
  const ageProofZkKYC = await deploySC('AgeProofZkKYC',
    true,
    {},
    [deployer.address, ageProofZkKYCVerifier.address, recordRegistry.address, galacticaInstitution.address]
  );
  const verificationSBT = await deploySC('VerificationSBT', true);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
