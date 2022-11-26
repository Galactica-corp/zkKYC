pragma solidity ^0.8.0;

interface IKYCRegistry {
    function getMerkleRoot() external view returns (bytes32);
}
