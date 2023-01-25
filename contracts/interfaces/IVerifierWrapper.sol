pragma solidity ^0.8.0;

interface IKYCRegistry {
    function verifier() external view returns (address);
}
