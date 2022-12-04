// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Ownable.sol";

contract KYCCenterRegistry is Ownable {

    mapping(address => bool) public KYCCenters;

    modifier onlyKYCCenter() {
        _checkKYCCenter(msg.sender);
        _;
    }

    constructor() Ownable(msg.sender) public {}

    function _checkKYCCenter(address account) internal view {
        if (!KYCCenters[account]) {
            revert("KYCCenterRegistry: not a KYC Center");
        }
    }

    function grantKYCCenterRole(address KYCCenter) public onlyOwner{
        KYCCenters[KYCCenter] = true;
    }

    function revokeKYCCenterRole(address KYCCenter) public onlyOwner{
        KYCCenters[KYCCenter] = false;
    }

    function renounceKYCCenterRole() public onlyOwner {
        KYCCenters[msg.sender] = false;
    }
}