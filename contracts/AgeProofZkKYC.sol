// SPDX-License-Identifier: MIT
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

    // indices of the ZKP public input array
    uint8 public constant INDEX_USER_PUBKEY_AX = 0;
    uint8 public constant INDEX_USER_PUBKEY_AY = 1;
    uint8 public constant INDEX_ENCRYPTED_DATA_0 = 2;
    uint8 public constant INDEX_ENCRYPTED_DATA_1 = 3;
    uint8 public constant INDEX_IS_VALID = 4;
    uint8 public constant INDEX_ROOT = 5;
    uint8 public constant INDEX_CURRENT_TIME = 6;
    uint8 public constant INDEX_USER_ADDRESS = 7;
    uint8 public constant INDEX_CURRENT_YEAR = 8;
    uint8 public constant INDEX_CURRENT_MONTH = 9;
    uint8 public constant INDEX_CURRENT_DAY = 10;
    uint8 public constant INDEX_AGE_THRESHOLD = 11;
    uint8 public constant INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AX = 12;
    uint8 public constant INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AY = 13;
    uint8 public constant INDEX_HUMAN_ID = 14;
    uint8 public constant INDEX_DAPP_ID = 15;
    uint8 public constant INDEX_PROVIDER_PUBKEY_AX = 16;
    uint8 public constant INDEX_PROVIDER_PUBKEY_AY = 17;

    constructor(address _owner, address _verifier, address _KYCRegistry, address _galacticaInstitution) Ownable(_owner) {
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
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[18] memory input
        ) public view returns (bool) {
        
        require(input[INDEX_IS_VALID] == 1, "the proof output is not valid");

        bytes32 proofRoot = bytes32(input[INDEX_ROOT]);
        require(KYCRegistry.rootHistory(proofRoot), "the root in the proof doesn't match");
        
        uint proofCurrentTime = input[INDEX_CURRENT_TIME];
        uint onchainTime = block.timestamp;
        uint timeDiff;
        if (proofCurrentTime > onchainTime) {
            timeDiff = proofCurrentTime - onchainTime;
        } else {
            timeDiff = onchainTime - proofCurrentTime;
        }
        require(timeDiff <= timeDifferenceTolerance, "the current time is incorrect");

        // tx.origin is used here so user doesn't need to submit proof directly to this SC but can also submit through dApp
        require(tx.origin == address(uint160(input[INDEX_USER_ADDRESS])), "transaction submitter is not authorized to use this proof");

        (uint onchainYear, uint onchainMonth, uint onchainDay) = BokkyPooBahsDateTimeLibrary.timestampToDate(onchainTime);

        require(onchainYear == input[INDEX_CURRENT_YEAR], "the current year is incorrect");
        require(onchainMonth == input[INDEX_CURRENT_MONTH], "the current month is incorrect");
        require(onchainDay == input[INDEX_CURRENT_DAY], "the current day is incorrect");

        // check that the institution public key corresponds to the onchain one;
        require(galacticaInstitution.institutionPubKey(0) == input[INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AX], "the first part of institution pubkey is incorrect");
        require(galacticaInstitution.institutionPubKey(1) == input[INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AY], "the second part of institution pubkey is incorrect");

        require(verifier.verifyProof(a, b, c, input), "the proof is incorrect");
        return true;
    }
}
