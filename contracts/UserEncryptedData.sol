// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Smart contract to store user encrypted data so he can reuse it in the frontend

contract UserEncryptedData {

    // mapping to store user encrypted data
    mapping(address => bytes) public encryptedData;


    // event emitted when user data is submitted
    event AddEncryptedData(address indexed user, bytes data);

    // function to add user encrypted data as event
    function addEncryptedData(bytes calldata data) public {
        encryptedData[msg.sender] = data;
        emit AddEncryptedData(msg.sender, data);
    }
}
