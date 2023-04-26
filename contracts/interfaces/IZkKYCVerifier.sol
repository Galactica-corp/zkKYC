// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @author Galactica dev team
interface IZkKYCVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[15] memory input) external view returns (bool);
}
