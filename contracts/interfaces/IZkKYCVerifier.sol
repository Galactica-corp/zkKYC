pragma solidity ^0.8.0;

interface IZkKYCVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[12] memory input) external view returns (bool);
}
