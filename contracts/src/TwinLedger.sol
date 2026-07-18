// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisErrors} from "./ThesisErrors.sol";

/// @title TwinLedger — public digital-twin balance ledger (no keys, no custody of real assets)
/// @notice Mirrors sandbox twin accounting onchain for audit / demos. Not a bank.
contract TwinLedger {
    address public admin;
    mapping(address => mapping(bytes32 => int256)) public twinBalance; // owner => assetId => amount (scaled 1e18)
    mapping(address => bool) public writers; // AI node / sandbox relays

    event WriterUpdated(address indexed writer, bool allowed);
    event TwinSet(address indexed owner, bytes32 indexed assetId, int256 amount, bytes32 source);
    event TwinDelta(address indexed owner, bytes32 indexed assetId, int256 delta, int256 newAmount);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert ThesisErrors.Unauthorized();
        _;
    }

    modifier onlyWriter() {
        if (!writers[msg.sender] && msg.sender != admin) revert ThesisErrors.Unauthorized();
        _;
    }

    constructor(address admin_) {
        if (admin_ == address(0)) revert ThesisErrors.ZeroAddress();
        admin = admin_;
        writers[admin_] = true;
    }

    function setWriter(address writer, bool allowed) external onlyAdmin {
        writers[writer] = allowed;
        emit WriterUpdated(writer, allowed);
    }

    function setTwin(address owner, bytes32 assetId, int256 amount, bytes32 source)
        external
        onlyWriter
    {
        if (owner == address(0)) revert ThesisErrors.ZeroAddress();
        twinBalance[owner][assetId] = amount;
        emit TwinSet(owner, assetId, amount, source);
    }

    function applyDelta(address owner, bytes32 assetId, int256 delta) external onlyWriter {
        int256 next = twinBalance[owner][assetId] + delta;
        twinBalance[owner][assetId] = next;
        emit TwinDelta(owner, assetId, delta, next);
    }

    function assetIdFromSymbol(string calldata symbol) external pure returns (bytes32) {
        return keccak256(bytes(symbol));
    }

    function balanceOf(address owner, string calldata symbol) external view returns (int256) {
        return twinBalance[owner][keccak256(bytes(symbol))];
    }
}
