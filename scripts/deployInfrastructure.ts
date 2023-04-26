import hre from "hardhat";
import { overwriteArtifact } from "../lib/helpers";
import { poseidonContract } from 'circomlibjs';
import { deploySC } from '../lib/hardhatHelpers';
import { buildEddsa } from 'circomlibjs';
import { getEddsaKeyFromEthSigner } from '../lib/keyManagement';

const log = console.log;


async function main() {
  // wallets
  const [ deployer, institutionSigner ] = await hre.ethers.getSigners();

  log(`Using account ${deployer.address} to deploy contracts`);
  log(`Account balance: ${(await deployer.getBalance()).toString()}`);

  log(`Using account ${institutionSigner.address} as institution for fraud investigation`);

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
  let institutionPrivKey = BigInt(
    await getEddsaKeyFromEthSigner(institutionSigner)
  ).toString();
  const eddsa = await buildEddsa();
  let institutionPub = eddsa.prv2pub(institutionPrivKey);
  // convert pubkey uint8array to decimal string
  institutionPub = institutionPub.map((x: Uint8Array) => eddsa.poseidon.F.toObject(x).toString());
  console.log('Institution pubkey: ', institutionPub);
  await galacticaInstitution.setInstitutionPubkey(institutionPub);

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
