pragma solidity ^0.6.11;

interface IKYCRegistry {
    function getMerkleRoot() external view returns (bytes32);
}
