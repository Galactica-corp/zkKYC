// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IVerificationSBT {

    function mintVerificationSBT(address user, IVerifierWrapper _verifierWrapper, uint _expirationTime, bytes32[2] calldata _encryptedData, bytes32 _humanID) external;

    function isVerificationSBTValid(address user, address dApp) external view returns(bool);

    function getVerificationSBTInfo(address user, address dApp) external returns(VerificationSBTInfo memory);

    function getHumanID(address user, address dApp) external view returns(bytes32);
}
