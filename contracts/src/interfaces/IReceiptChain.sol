// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IReceiptChain {
    function seal(
        address vault,
        bytes32 stateHash,
        bytes32 actionHash,
        address agent,
        bool success
    ) external returns (bytes32 receiptHash);

    function latestReceipt(address vault) external view returns (bytes32);

    function verifyChain(address vault, bytes32[] calldata hashes) external view returns (bool);
}
