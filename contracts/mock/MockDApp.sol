// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../VerificationSBT.sol";
import "../interfaces/IAgeProofZkKYCVerifier.sol";
import "../interfaces/IVerifierWrapper.sol";

/// @author Galactica dev team
//For testing purpose we will create a mock dApp that airdrops 2 types tokens (100 each) for user
//Only users with a valid zkKYC record and older than 18 can receive the airdrop
//There are two things that we will test
//1. After the first airdrop claim the SC will mint a verification SBT for that user
//2. With the verification SBT user won't need to supply the zk proof
contract MockDApp {

    // mappings to see if certain humanID has received the token airdrop
    // in real DApp this should be a merkle root so that we can aggregate data across different humanID in a zk way
    // but here for simplicity I use normal mapping
    mapping(bytes32 => bool) public hasReceivedToken1;
    mapping(bytes32 => bool) public hasReceivedToken2;

    ERC20 public token1;
    ERC20 public token2;
    uint public constant token1AirdropAmount = 100;
    uint public constant token2AirdropAmount = 100;
    VerificationSBT public SBT;
    IVerifierWrapper public verifierWrapper; 

    constructor(VerificationSBT _SBT, IVerifierWrapper _verifierWrapper) {
        SBT = _SBT;
        verifierWrapper = _verifierWrapper;
    }


    function setToken1(ERC20 _token1) public {
        token1 = _token1;
    }

    function setToken2(ERC20 _token2) public {
        token2 = _token2;
    }

    function airdropToken(
        uint tokenIndex,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[16] memory input
    ) public {
        bytes32 humanID;
        // first check if this user already already has a verification SBT, if no we will check the supplied proof
        if (!SBT.isVerificationSBTValid(msg.sender, address(this))) {
            
            humanID = bytes32(input[14]);
            uint dAppAddress = input[15];

            // check that the public dAppAddress is correct
            require(dAppAddress == uint(uint160(address(this))), "incorrect dAppAddress");

            // check the zk proof
            require(IAgeProofZkKYCVerifier(address(verifierWrapper)).verifyProof(a, b, c, input), "zk proof is invalid");

            

            //afterwards we mint the verification SBT
            uint256[2] memory userPubKey = [input[0], input[1]];
            bytes32[2] memory encryptedData = [bytes32(input[2]), bytes32(input[3])];
            SBT.mintVerificationSBT(msg.sender, verifierWrapper, 1990878924, encryptedData, userPubKey, humanID);
        }

        humanID = SBT.getHumanID(msg.sender, address(this));

        // if everything is good then we transfer the airdrop
        // then mark it in the mapping
        if (tokenIndex==1) {
            require(!hasReceivedToken1[humanID], "this humandID has already received this airdrop");
            token1.transfer(msg.sender, token1AirdropAmount);
            hasReceivedToken1[humanID] = true;
        } else if (tokenIndex==2) {
            require(!hasReceivedToken2[humanID], "this humandID has already received this airdrop");
            token1.transfer(msg.sender, token2AirdropAmount);
            hasReceivedToken2[humanID] = true;
        } else {
            revert("invalid token index");
        }
    }
}