pragma solidity ^0.6.11;

contract MockKYCRegistry {

    bytes32 public merkleRoot = bytes32("17029810224651811805425930092085496299322617147701484775397986650506962045188");

    function setMerkleRoot(bytes32 newMerkleRoot) public {
        merkleRoot = newMerkleRoot;
    }
    function getMerkleRoot() public view returns (bytes32) {
        return merkleRoot;
    };
}
