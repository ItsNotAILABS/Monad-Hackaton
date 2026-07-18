// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "../ThesisTypes.sol";

/// @title Deterministic hashing for actions / receipts / laws
library Hashing {
    function actionHash(ThesisTypes.Action memory a) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                a.agent,
                a.target,
                a.value,
                a.slippageBps,
                a.gasLimit,
                a.estimatedGas,
                a.category,
                keccak256(a.data),
                a.deadline
            )
        );
    }

    function actionHashCalldata(
        address agent,
        address target,
        uint256 value,
        uint256 slippageBps,
        bytes calldata data
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(agent, target, value, slippageBps, keccak256(data)));
    }

    function actionHashBytes(
        address agent,
        address target,
        uint256 value,
        uint256 slippageBps,
        bytes memory data
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(agent, target, value, slippageBps, keccak256(data)));
    }

    function receiptHash(
        address vault,
        bytes32 previous,
        bytes32 stateHash,
        bytes32 actionHash_,
        address agent,
        uint256 timestamp,
        bool success
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(vault, previous, stateHash, actionHash_, agent, timestamp, success));
    }

    function lawId(string memory id) internal pure returns (bytes32) {
        return keccak256(bytes(id));
    }

    function categoryId(string memory category) internal pure returns (bytes32) {
        return keccak256(bytes(category));
    }
}
