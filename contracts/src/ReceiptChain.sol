// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "./ThesisTypes.sol";
import {ThesisErrors} from "./ThesisErrors.sol";
import {Hashing} from "./libraries/Hashing.sol";

/// @title ReceiptChain — hash-linked audit spine (NERVUS)
contract ReceiptChain {
    mapping(address => bytes32) public latestReceipt;
    mapping(bytes32 => ThesisTypes.Receipt) public receipts;
    mapping(address => uint256) public receiptCount;
    /// @notice Optional allowlist of sealers (vaults). If empty, anyone may seal (testnet).
    mapping(address => bool) public isSealer;
    bool public sealerGateEnabled;
    address public admin;

    event ReceiptSealed(
        address indexed vault,
        bytes32 indexed receiptHash,
        bytes32 previousHash,
        address indexed agent,
        bool success
    );
    event SealerUpdated(address indexed sealer, bool allowed);
    event SealerGate(bool enabled);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert ThesisErrors.Unauthorized();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function setAdmin(address next) external onlyAdmin {
        if (next == address(0)) revert ThesisErrors.ZeroAddress();
        admin = next;
    }

    function setSealer(address sealer, bool allowed) external onlyAdmin {
        isSealer[sealer] = allowed;
        emit SealerUpdated(sealer, allowed);
    }

    function setSealerGate(bool enabled) external onlyAdmin {
        sealerGateEnabled = enabled;
        emit SealerGate(enabled);
    }

    function seal(address vault, bytes32 stateHash, bytes32 actionHash, address agent, bool success)
        external
        returns (bytes32 receiptHash)
    {
        if (sealerGateEnabled && !isSealer[msg.sender] && msg.sender != vault) {
            revert ThesisErrors.Unauthorized();
        }
        if (vault == address(0) || agent == address(0)) revert ThesisErrors.ZeroAddress();

        bytes32 previous = latestReceipt[vault];
        receiptHash = Hashing.receiptHash(
            vault, previous, stateHash, actionHash, agent, block.timestamp, success
        );

        receipts[receiptHash] = ThesisTypes.Receipt({
            previousHash: previous,
            stateHash: stateHash,
            actionHash: actionHash,
            agent: agent,
            vault: vault,
            timestamp: uint64(block.timestamp),
            blockNumber: uint64(block.number),
            success: success
        });
        latestReceipt[vault] = receiptHash;
        unchecked {
            receiptCount[vault] += 1;
        }
        emit ReceiptSealed(vault, receiptHash, previous, agent, success);
    }

    /// @notice Verify tip walks back through previousHash links.
    function verifyChain(address vault, bytes32[] calldata hashes) external view returns (bool) {
        uint256 n = hashes.length;
        if (n == 0) return latestReceipt[vault] == bytes32(0);
        if (hashes[0] != latestReceipt[vault]) return false;
        for (uint256 i = 0; i < n; ) {
            ThesisTypes.Receipt memory r = receipts[hashes[i]];
            if (r.vault != vault && r.timestamp == 0) return false;
            if (i + 1 < n) {
                if (r.previousHash != hashes[i + 1]) return false;
            }
            unchecked {
                ++i;
            }
        }
        return true;
    }

    function getReceipt(bytes32 h) external view returns (ThesisTypes.Receipt memory) {
        return receipts[h];
    }
}
