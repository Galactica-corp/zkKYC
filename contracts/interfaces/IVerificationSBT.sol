// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @author Galactica dev team
import "./IVerifierWrapper.sol";

interface IVerificationSBT {

    struct VerificationSBTInfo {
        address dApp;
        IVerifierWrapper verifierWrapper;
        uint256 expirationTime;
        bytes32 verifierCodehash;
        bytes32[2] encryptedData;
        uint256[2] userPubKey;
        bytes32 humanID;
        uint256[2] providerPubKey;
    }
     
    function mintVerificationSBT(
        address user, 
        IVerifierWrapper _verifierWrapper, 
        uint _expirationTime, 
        bytes32[2] calldata _encryptedData, 
        uint256[2] calldata _userPubKey, 
        bytes32 _humanID,
        uint256[2] calldata _providerPubKey
    ) external;

    function isVerificationSBTValid(address user, address dApp) external view returns(bool);

    function getVerificationSBTInfo(address user, address dApp) external view returns(VerificationSBTInfo memory);

    function getHumanID(address user, address dApp) external view returns(bytes32);
}
