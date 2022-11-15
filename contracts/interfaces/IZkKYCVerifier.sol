pragma solidity ^0.6.11;

interface IZkKYCVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[4] memory input) external view returns (bool);
}
