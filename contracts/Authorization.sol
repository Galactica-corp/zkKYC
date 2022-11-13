
pragma solidity ^0.6.11;

import "./Ownable.sol";
import "./interfaces/IVerifier.sol";

contract ZkKYC is Ownable{
    IVerifier public verifier;

    constructor(address _owner, address _verifier) Ownable(_owner) public {
        verifier = IVerifier(_verifier);
    }

    function setVerifier(IVerifier newVerifier) public onlyOwner {
        verifier = newVerifier;
    }

    //a, b, c are the proof
    // input array contains the public parameters: isValid, root, currentTime
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[1] memory input
        ) public {
        
        require(input[0] == msg.sender, "not authorized to send this proof");

        require(verifier.verifyProof(a, b, c, input), "the authorization proof is incorrect");
    }
}
