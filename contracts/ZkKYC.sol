
pragma solidity ^0.6.11;

import "./Ownable.sol";
import "./interfaces/IZkKYCVerifier.sol";
import "./interfaces/IKYCRegistry.sol";

contract ZkKYC is Ownable{
    IZkKYCVerifier public verifier;
    IKYCRegistry public KYCRegistry;
    uint256 public constant timeDifferenceTolerance = 120; // the maximal difference between the onchain time and public input current time

    constructor(address _owner, address _verifier, address _KYCRegistry) Ownable(_owner) public {
        verifier = IZkKYCVerifier(_verifier);
        KYCRegistry = IKYCRegistry(_KYCRegistry);
    }

    function setVerifier(IZkKYCVerifier newVerifier) public onlyOwner {
        verifier = newVerifier;
    }

    function setKYCRegistry(IKYCRegistry newKYCRegistry) public onlyOwner {
        KYCRegistry = newKYCRegistry;
    }

    //a, b, c are the proof
    // input array contains the public parameters: isValid, root, currentTime
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[4] memory input
        ) public view {
        
        require(input[0] == 1, "the proof output is not valid");

        bytes32 proofRoot = bytes32(input[1]);
        require(proofRoot == KYCRegistry.getMerkleRoot(), "the root in the proof doesn't match");
        
        uint proofCurrentTime = input[2];
        uint timeDiff;
        if (proofCurrentTime > block.timestamp) {
            timeDiff = proofCurrentTime - block.timestamp;
        } else {
            timeDiff = block.timestamp - proofCurrentTime;
        }
        require(timeDiff <= timeDifferenceTolerance, "the current time is incorrect");

        require(msg.sender == address(input[3]), "sender is not authorized to use this proof");


        require(verifier.verifyProof(a, b, c, input), "the proof is incorrect");
    }
}
