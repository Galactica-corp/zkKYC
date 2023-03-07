
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

    constructor(address _owner, address _verifier, address _KYCRegistry, address _galacticaInstitution) Ownable(_owner) public {
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
        
        require(input[0] == 1, "the proof output is not valid");

        bytes32 proofRoot = bytes32(input[1]);
        require(KYCRegistry.rootHistory(proofRoot), "the root in the proof doesn't match");
        
        uint proofCurrentTime = input[2];
        uint timeDiff;
        if (proofCurrentTime > block.timestamp) {
            timeDiff = proofCurrentTime - block.timestamp;
        } else {
            timeDiff = block.timestamp - proofCurrentTime;
        }
        require(timeDiff <= timeDifferenceTolerance, "the current time is incorrect");

        // dev note: if we ever use proof hash, make sure to pay attention to this truncation to uint160 as it can violate uniqueness
        require(tx.origin == address(uint160(input[3])), "transaction submitter is not authorized to use this proof");

        // check that the institution public key corresponds to the onchain one;
        require(galacticaInstitution.institutionPubKey(0) == input[6], "the first part of institution pubkey is incorrect");
        require(galacticaInstitution.institutionPubKey(1) == input[7], "the second part of institution pubkey is incorrect");

        require(verifier.verifyProof(a, b, c, input), "the proof is incorrect");
    }
}
