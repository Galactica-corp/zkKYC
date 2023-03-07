pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./interfaces/IAgeProofZkKYCVerifier.sol";
import "./interfaces/IKYCRegistry.sol";
import "./libraries/BokkyPooBahsDateTimeLibrary.sol";
import "./interfaces/IGalacticaInstitution.sol";
import "hardhat/console.sol";

/// @author Galactica dev team
/// @title A wrapper for verifier with age condition
contract AgeProofZkKYC is Ownable{
    IAgeProofZkKYCVerifier public verifier;
    IKYCRegistry public KYCRegistry;
    IGalacticaInstitution public galacticaInstitution;
    uint256 public constant timeDifferenceTolerance = 120; // the maximal difference between the onchain time and public input current time

    constructor(address _owner, address _verifier, address _KYCRegistry, address _galacticaInstitution) Ownable(_owner) public {
        verifier = IAgeProofZkKYCVerifier(_verifier);
        KYCRegistry = IKYCRegistry(_KYCRegistry);
        galacticaInstitution = IGalacticaInstitution(_galacticaInstitution);
    }

    function setVerifier(IAgeProofZkKYCVerifier newVerifier) public onlyOwner {
        verifier = newVerifier;
    }

    function setKYCRegistry(IKYCRegistry newKYCRegistry) public onlyOwner {
        KYCRegistry = newKYCRegistry;
    }

    function setGalacticaInstituion(IGalacticaInstitution newGalacticaInstitution) public onlyOwner {
        galacticaInstitution = newGalacticaInstitution;
    }

    //a, b, c are the proof
    // input array contains the public parameters: isValid, root, currentTime, userAddress, currentYear, currentMonth, currentDay, ageThreshold, userPubKey, investigationInstitutionPubKey, encryptedData, humanID, dAppID
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[16] memory input
        ) public view returns (bool) {
        
        require(input[0] == 1, "the proof output is not valid");

        bytes32 proofRoot = bytes32(input[1]);
        require(KYCRegistry.rootHistory(proofRoot), "the root in the proof doesn't match");
        
        uint proofCurrentTime = input[2];
        uint onchainTime = block.timestamp;
        uint timeDiff;
        if (proofCurrentTime > onchainTime) {
            timeDiff = proofCurrentTime - onchainTime;
        } else {
            timeDiff = onchainTime - proofCurrentTime;
        }
        require(timeDiff <= timeDifferenceTolerance, "the current time is incorrect");

        // tx.origin is used here so user doesn't need to submit proof directly to this SC but can also submit through dApp
        require(tx.origin == address(uint160(input[3])), "transaction submitter is not authorized to use this proof");

        (uint onchainYear, uint onchainMonth, uint onchainDay) = BokkyPooBahsDateTimeLibrary.timestampToDate(onchainTime);

        require(onchainYear == input[4], "the current year is incorrect");
        require(onchainMonth == input[5], "the current month is incorrect");
        require(onchainDay == input[6], "the current day is incorrect");

        // check that the institution public key corresponds to the onchain one;
        require(galacticaInstitution.institutionPubKey(0) == input[9], "the first part of institution pubkey is incorrect");
        require(galacticaInstitution.institutionPubKey(1) == input[10], "the second part of institution pubkey is incorrect");

        require(verifier.verifyProof(a, b, c, input), "the proof is incorrect");
        return true;
    }
}
