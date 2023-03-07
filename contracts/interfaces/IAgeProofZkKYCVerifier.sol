pragma solidity ^0.8.0;

/// @author Galactica dev team
interface IAgeProofZkKYCVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[16] memory input) external view returns (bool);
}
