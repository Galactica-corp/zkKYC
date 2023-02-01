// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IVerifierWrapper.sol";


// A global smart contract that store verification SBT, minted by dApp for users submitting zk proofs

contract VerificationSBT {

    struct VerificationSBTInfo {
        address dApp;
        IVerifierWrapper verifierWrapper;
        uint256 expirationTime;
        bytes32 verifierCodehash;
        bytes32[2] encryptedData;
    }

    // mapping to store verification SBT
    mapping(bytes32 => VerificationSBTInfo) public VerificationSBTMapping;


    // event emitted when a verification SBT is minted
    event VerificationSBTMinted(address dApp, address user);

    // function to mint verification SBT
    function mintVerificationSBT(address user, IVerifierWrapper _verifierWrapper, uint _expirationTime, bytes32[2] calldata _encryptedData) public {
        VerificationSBTMapping[keccak256(abi.encode(user, msg.sender))] = VerificationSBTInfo({
            dApp: msg.sender,
            verifierWrapper: _verifierWrapper, 
            expirationTime: _expirationTime,
            verifierCodehash: _verifierWrapper.verifier().codehash,
            encryptedData: _encryptedData
        });
        emit VerificationSBTMinted(msg.sender, user);
    }

    // function to check the validity of verification SBT
    function isVerificationSBTValid(address user, address dApp) view public returns(bool) {
        VerificationSBTInfo storage verificationSBTInfo = VerificationSBTMapping[keccak256(abi.encode(user, dApp))];
        // we check 2 conditions
        // 1. the codehash of the verifier is still the same as the one referred to in the verification wrapper
        // 2. the expiration time hasn't happened yet
        return (verificationSBTInfo.verifierWrapper.verifier().codehash == verificationSBTInfo.verifierCodehash) && (verificationSBTInfo.expirationTime > block.timestamp);
    }
}
