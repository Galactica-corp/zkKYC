pragma solidity ^0.8.0;

//For testing purpose we will create a mock dApp that airdrops 2 types tokens (100 each) for user
//Only users with a valid zkKYC record and older than 18 can receive the airdrop
//There are two things that we will test
//1. After the first airdrop claim the SC will mint a verification SBT for that user
//2. With the verification SBT user won't need to supply the zk proof
contract MockGDApp {

    // mappings to see if certain humanID has received the token airdrop
    mapping(bytes32 => bool) public hasReceivedToken1;
    mapping(bytes32 => bool) public hasReceivedToken2;

    address public token1;
    address public token2;

    function setToken1(address _token1) public {
        token1 = _token1;
    }

    function setToken2(address _token2) public {
        token2 = _token2;
    }

    function airdropToken1() public {
        
    }
}