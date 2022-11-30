pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./interfaces/IAgeProofZkKYCVerifier.sol";
import "./interfaces/IKYCRegistry.sol";
import "./libraries/BokkyPooBahsDateTimeLibrary.sol";

contract AgeProofZkKYC is Ownable{
    IAgeProofZkKYCVerifier public verifier;
    IKYCRegistry public KYCRegistry;
    uint256 public constant timeDifferenceTolerance = 120; // the maximal difference between the onchain time and public input current time

    constructor(address _owner, address _verifier, address _KYCRegistry) Ownable(_owner) public {
        verifier = IAgeProofZkKYCVerifier(_verifier);
        KYCRegistry = IKYCRegistry(_KYCRegistry);
    }

    function setVerifier(IAgeProofZkKYCVerifier newVerifier) public onlyOwner {
        verifier = newVerifier;
    }

    function setKYCRegistry(IKYCRegistry newKYCRegistry) public onlyOwner {
        KYCRegistry = newKYCRegistry;
    }

    //a, b, c are the proof
    // input array contains the public parameters: isValid, root, currentTime, currentYear, currentMonth, currentDay, ageThreshold
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[8] memory input
        ) public view {
        
        require(input[0] == 1, "the proof output is not valid");

        bytes32 proofRoot = bytes32(input[1]);
        require(proofRoot == KYCRegistry.getMerkleRoot(), "the root in the proof doesn't match");
        
        uint proofCurrentTime = input[2];
        uint onchainTime = block.timestamp;
        uint timeDiff;
        if (proofCurrentTime > onchainTime) {
            timeDiff = proofCurrentTime - onchainTime;
        } else {
            timeDiff = onchainTime - proofCurrentTime;
        }
        require(timeDiff <= timeDifferenceTolerance, "the current time is incorrect");

        require(msg.sender == address(uint160(input[3])), "sender is not authorized to use this proof");

        (uint onchainYear, uint onchainMonth, uint onchainDay) = BokkyPooBahsDateTimeLibrary.timestampToDate(onchainTime);
        require(onchainYear == input[4], "the current year is incorrect");
        require(onchainMonth == input[5], "the current month is incorrect");
        require(onchainDay == input[6], "the current day is incorrect");

        require(verifier.verifyProof(a, b, c, input), "the proof is incorrect");
    }
}
