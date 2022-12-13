pragma solidity ^0.8.0;

contract MockKYCRegistry {

    bytes32 public merkleRoot;
    mapping(bytes32 => bool) public rootHistory;
    
    function setMerkleRoot(bytes32 newMerkleRoot) public {
        rootHistory[newMerkleRoot] = true;
    }
}
