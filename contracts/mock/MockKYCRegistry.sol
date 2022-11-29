pragma solidity ^0.8.0;

contract MockKYCRegistry {

    bytes32 public merkleRoot;

    function setMerkleRoot(bytes32 newMerkleRoot) public {
        merkleRoot = newMerkleRoot;
    }
    function getMerkleRoot() public view returns (bytes32) {
        return merkleRoot;
    }
}
