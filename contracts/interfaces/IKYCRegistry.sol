pragma solidity ^0.6.11;

interface IKYCRegistry {
    function getMerkleRoot() public view returns (bytes32);
}
