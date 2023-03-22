// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./interfaces/IZkKYCVerifier.sol";
import "./interfaces/IKYCRegistry.sol";
import "./interfaces/IGalacticaInstitution.sol";

/// @author Galactica dev team
/// @title a wrapper for verifier of ZkKYC record existence
contract ZkKYC is Ownable{
    IZkKYCVerifier public verifier;
    IKYCRegistry public KYCRegistry;
    IGalacticaInstitution public galacticaInstitution;
    uint256 public constant timeDifferenceTolerance = 120; // the maximal difference between the onchain time and public input current time

    // indices of the ZKP public input array
    uint8 internal constant INDEX_USER_PUBKEY_AX = 0;
    uint8 internal constant INDEX_USER_PUBKEY_AY = 1;
    uint8 internal constant INDEX_ENCRYPTED_DATA_0 = 2;
    uint8 internal constant INDEX_ENCRYPTED_DATA_1 = 3;
    uint8 internal constant INDEX_IS_VALID = 4;
    uint8 internal constant INDEX_ROOT = 5;
    uint8 internal constant INDEX_CURRENT_TIME = 6;
    uint8 internal constant INDEX_USER_ADDRESS = 7;
    uint8 internal constant INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AX = 8;
    uint8 internal constant INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AY = 9;
    uint8 internal constant INDEX_HUMAN_ID = 10;
    uint8 internal constant INDEX_DAPP_ID = 11;

    constructor(address _owner, address _verifier, address _KYCRegistry, address _galacticaInstitution) Ownable(_owner) {
        verifier = IZkKYCVerifier(_verifier);
        KYCRegistry = IKYCRegistry(_KYCRegistry);
        galacticaInstitution = IGalacticaInstitution(_galacticaInstitution);
    }

    function setVerifier(IZkKYCVerifier newVerifier) public onlyOwner {
        verifier = newVerifier;
    }

    function setKYCRegistry(IKYCRegistry newKYCRegistry) public onlyOwner {
        KYCRegistry = newKYCRegistry;
    }

    function setGalacticaInstituion(IGalacticaInstitution newGalacticaInstitution) public onlyOwner {
        galacticaInstitution = newGalacticaInstitution;
    }

    //a, b, c are the proof
    // input array contains the public parameters: isValid, root, currentTime
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[12] memory input
        ) public view {
        
        require(input[INDEX_IS_VALID] == 1, "the proof output is not valid");

        bytes32 proofRoot = bytes32(input[INDEX_ROOT]);
        require(KYCRegistry.rootHistory(proofRoot), "the root in the proof doesn't match");
        
        uint proofCurrentTime = input[INDEX_CURRENT_TIME];
        uint timeDiff;
        if (proofCurrentTime > block.timestamp) {
            timeDiff = proofCurrentTime - block.timestamp;
        } else {
            timeDiff = block.timestamp - proofCurrentTime;
        }
        require(timeDiff <= timeDifferenceTolerance, "the current time is incorrect");

        // dev note: if we ever use proof hash, make sure to pay attention to this truncation to uint160 as it can violate uniqueness
        require(tx.origin == address(uint160(input[INDEX_USER_ADDRESS])), "transaction submitter is not authorized to use this proof");

        // check that the institution public key corresponds to the onchain one;
        require(galacticaInstitution.institutionPubKey(0) == input[INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AX], "the first part of institution pubkey is incorrect");
        require(galacticaInstitution.institutionPubKey(1) == input[INDEX_INVESTIGATION_INSTITUTION_PUBKEY_AY], "the second part of institution pubkey is incorrect");

        require(verifier.verifyProof(a, b, c, input), "the proof is incorrect");
    }
}
