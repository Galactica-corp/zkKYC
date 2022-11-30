// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
pragma abicoder v2;

import { KYCRecordRegistry } from "../KYCRecordRegistry.sol";

contract KYCRecordRegistryTest is KYCRecordRegistry {
  constructor() {
    initializeKYCRecordRegistryTest();
  }

  function doubleInit() external {
    KYCRecordRegistry.initializeKYCRecordRegistry();
  }

  function initializeKYCRecordRegistryTest() internal initializer {
    KYCRecordRegistry.initializeKYCRecordRegistry();
  }

  function insertLeavesTest(bytes32[] memory _leafHashes) external {
    KYCRecordRegistry.insertLeaves(_leafHashes);
  }

  function setNextLeafIndex(uint256 _index) external {
    KYCRecordRegistry.nextLeafIndex = _index;
  }
}