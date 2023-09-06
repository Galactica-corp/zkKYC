// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.7;
pragma abicoder v2;

// OpenZeppelin v4
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import { SNARK_SCALAR_FIELD } from "./helpers/Globals.sol";

import { PoseidonT3 } from "./helpers/Poseidon.sol";

import { KYCCenterRegistry } from "./KYCCenterRegistry.sol";

/**
 * @title KYCRecordRegistry
 * @author Galactica dev team
 * @notice Batch Incremental Merkle Tree for zkKYC records
 * Relevant external contract calls should be in those functions, not here
 */
contract KYCRecordRegistry2 is Initializable {
  // NOTE: The order of instantiation MUST stay the same across upgrades
  // add new variables to the bottom of the list and decrement the __gap
  // variable at the end of this file
  // See https://docs.openzeppelin.com/learn/upgrading-smart-contracts#upgrading

  // The tree depth and size
  uint256 internal constant TREE_DEPTH = 32;
  uint256 internal constant TREE_SIZE = 2 ** 32;

  // Tree zero value
  bytes32 public constant ZERO_VALUE = bytes32(uint256(keccak256("Galactica")) % SNARK_SCALAR_FIELD);

  // Next leaf index (number of inserted leaves in the current tree)
  uint256 public nextLeafIndex;

  // The Merkle root
  bytes32 public merkleRoot;

  // The Merkle path to the leftmost leaf upon initialization. It *should
  // not* be modified after it has been set by the initialize function.
  // Caching these values is essential to efficient appends.
  bytes32[TREE_DEPTH] public zeros;


  KYCCenterRegistry public _KYCCenterRegistry;
  event zkKYCRecordAddition(bytes32 indexed zkKYCRecordLeafHash, address indexed KYCCenter);
  event zkKYCRecordRevocation(bytes32 indexed zkKYCRecordLeafHash, address indexedKYCCenter);

  /**
   * @notice Calculates initial values for Merkle Tree
   * @dev OpenZeppelin initializer ensures this can only be called once
   */
  function initializeKYCRecordRegistry(address KYCCenterRegistry_) internal onlyInitializing {
    /*
    To initialize the Merkle tree, we need to calculate the Merkle root
    assuming that each leaf is the zero value.
    H(H(a,b), H(c,d))
      /          \
    H(a,b)     H(c,d)
    /   \       /  \
    a    b     c    d
    `zeros` and `filledSubTrees` will come in handy later when we do
    inserts or updates. e.g when we insert a value in index 1, we will
    need to look up values from those arrays to recalculate the Merkle
    root.
    */

    // Calculate zero values
    zeros[0] = ZERO_VALUE;

    // Store the current zero value for the level we just calculated it for
    bytes32 currentZero = ZERO_VALUE;

    // Loop through each level
    for (uint256 i = 0; i < TREE_DEPTH; i += 1) {
      // Push it to zeros array
      zeros[i] = currentZero;

      // Calculate the zero value for this level
      currentZero = hashLeftRight(currentZero, currentZero);
    }

    // Set merkle root and store root to quickly retrieve later
    newTreeRoot = merkleRoot = currentZero;
    _KYCCenterRegistry = KYCCenterRegistry(KYCCenterRegistry_);
  }

  function addZkKYCRecord(uint256 leafIndex, bytes32 zkKYCRecordHash, bytes32[] calldata merkleProof) public {
        // since we are adding a new zkKYC record, we assume that the leaf is of zero value
        bytes32 currentLeafHash = ZERO_VALUE;
      require(_KYCCenterRegistry.KYCCenters(msg.sender), "KYCRecordRegistry: not a KYC Center");
      _changeLeafHash(leafIndex, currentLeafHash, zkKYCRecordHash, merkleProof);
      emit zkKYCRecordAddition(zkKYCRecordLeafHash, msg.sender);
  }

  function revokeZkKYCRecord(uint256 leafIndex, bytes32 zkKYCRecordHash, bytes32[] calldata merkleProof) public {
        // since we are deleting the content of a leaf, the new value is the zero value
        bytes32 newLeafHash = ZERO_VALUE;
        require(_KYCCenterRegistry.KYCCenters(msg.sender), "KYCRecordRegistry: not a KYC Center");
        _changeLeafHash(leafIndex, zkKYCRecordHash, newLeafHash, merkleProof);
        emit zkKYCRecordRevocation(zkKYCRecordHash, msg.sender);
  }

    /** @notice Function change the leaf content at a certain index
    * @param index the index of the overwritten leaf in the last level
    * @param currentLeafHash the current content of the leaf
    * @param newLeafHash the new content we want to write into the leaf
    * @param merkleProof the merkle sibling path
    **/ 
  function _changeLeafHash(uint256 index, bytes32 currentLeafHash, bytes32 newLeafHash, bytes32[] merkleProof) internal {
    require(
			validate(merkleProof, index, currentLeafHash, merkleRoot),
		  	"merkle proof is not valid"
		);
        // we update the merkle tree accordingly
        merkleRoot = compute(merkleProof, index, newLeafHash);
  }

  /**
   * @notice Hash 2 uint256 values
   * @param _left - Left side of hash
   * @param _right - Right side of hash
   * @return hash result
   */
  function hashLeftRight(bytes32 _left, bytes32 _right) public pure returns (bytes32) {
    return PoseidonT3.poseidon([_left, _right]);
  }
    /**
    * @notice function to validate a leaf content at a certain index with its merkle proof against a certain merkle root
     */
  function validate(
		bytes32[] calldata merkleProof,
      	uint256 index,
      	bytes32 leafHash,
	 	bytes32 merkleRoot
	) internal pure returns (bool) {
		return (compute(merkleProof, index, leafHash) == merkleRoot);
	}

    function compute(
      bytes32[] calldata merkleProof,
      uint256 index,
      bytes32 leafHash
    ) internal pure returns (bytes32) {
        require(_index < TREE_SIZE, "_index bigger than tree size");
        require(_proofs.length != TREE_DEPTH, "Invalid _proofs length");

     	for (uint256 d = 0; d < TREE_DEPTH; d++) {
        	if ((_index & 1) == 1) {
                leafHash = hash(merkleProof[d], leafHash);
        	} else {
                leafHash = hash(leafHash, merkleProof[d]);
        	}
        	index = index >> 1;
      	}
		return leafHash;
    }

}