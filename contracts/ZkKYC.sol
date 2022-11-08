
pragma solidity ^0.6.11;

import "./Ownable.sol";
import "./interfaces/IVerifier.sol";
import "./interfaces/IKYCRegistry.sol";

contract ZkKYC is Ownable{
    IVerifier public verifier;
    IKYCRegistry public KYCRegistry;
    uint256 public constant timeDifferenceTolerance = 120; // the maximal difference between the onchain time and public input current time

    constructor(address _owner, address _verifier, address _KYCRegistry) Ownable(_owner) public {
        verifier = IVerifier(_verifier);
        KYCRegistry = IKYCRegistry(_KYCRegistry);
    }

    function setVerifier(address newVerifier) public onlyOwner {
        verifer = newVerifier;
    }

    function setKYCRegistry(address newKYCRegistry) public onlyOwner {
        KYCRegistry = newKYCRegistry;
    }

    //a, b, c are the proof
    // input array contains the public parameters: isValid, root, currentTime
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[3] memory input
        ) public {
        
        require(input[0] == 1, "the proof output is not valid");

        bytes32 proofRoot = bytes32(input[1]);
        require(proofRoot == KYCRegistry.getMerkleRoot(), "the root in the proof doesn't match");
        
        uint proofCurrentTime = input[2];
        uint timeDiff;
        if proofCurrentTime > block.timestamp {
            timeDiff = proofCurrentTime - block.timestamp;
        } else {
            timeDiff = block.timestamp - proofCurrentTime;
        }
        require(timeDiff <= timeDifferenceTolerance, "the current time is incorrect");

        require(verifier.verifyProof(a, b, c, input), "the proof is incorrect");
    }
}
