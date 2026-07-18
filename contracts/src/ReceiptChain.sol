// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ReceiptChain {
    struct Receipt { bytes32 previousHash; bytes32 stateHash; bytes32 actionHash; address agent; uint64 timestamp; bool success; }
    mapping(address => bytes32) public latestReceipt;
    mapping(bytes32 => Receipt) public receipts;
    event ReceiptSealed(address indexed vault, bytes32 indexed receiptHash, bytes32 previousHash, address indexed agent, bool success);

    function seal(address vault, bytes32 stateHash, bytes32 actionHash, address agent, bool success) external returns (bytes32 receiptHash) {
        bytes32 previous = latestReceipt[vault];
        receiptHash = keccak256(abi.encode(vault, previous, stateHash, actionHash, agent, block.timestamp, success));
        receipts[receiptHash] = Receipt(previous, stateHash, actionHash, agent, uint64(block.timestamp), success);
        latestReceipt[vault] = receiptHash;
        emit ReceiptSealed(vault, receiptHash, previous, agent, success);
    }
}
