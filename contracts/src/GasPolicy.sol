// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {GasHints} from "./libraries/GasHints.sol";
import {ThesisErrors} from "./ThesisErrors.sol";

/// @title GasPolicy — onchain Monad gas-limit coach parameters
contract GasPolicy {
    uint256 public marginBps = GasHints.DEFAULT_MARGIN_BPS; // 10750
    uint256 public overspendMultiplier = GasHints.OVERSPEND_MULTIPLIER;
    address public admin;

    event MarginUpdated(uint256 marginBps);
    event OverspendUpdated(uint256 multiplier);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert ThesisErrors.Unauthorized();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function setMarginBps(uint256 bps) external onlyAdmin {
        if (bps < 10_000 || bps > 20_000) revert ThesisErrors.InvalidBps(bps);
        marginBps = bps;
        emit MarginUpdated(bps);
    }

    function setOverspendMultiplier(uint256 m) external onlyAdmin {
        if (m < 2 || m > 50) revert ThesisErrors.InvalidPolicy();
        overspendMultiplier = m;
        emit OverspendUpdated(m);
    }

    function recommend(uint256 estimatedGas) external view returns (uint256) {
        return GasHints.recommendedGasLimit(estimatedGas, marginBps);
    }

    function isSane(uint256 gasLimit, uint256 estimatedGas) external view returns (bool) {
        if (estimatedGas == 0) {
            return gasLimit == GasHints.NATIVE_TRANSFER_GAS || gasLimit <= 100_000;
        }
        if (gasLimit < estimatedGas) return false;
        if (gasLimit > estimatedGas * overspendMultiplier) return false;
        return true;
    }

    function nativeTransferGas() external pure returns (uint256) {
        return GasHints.NATIVE_TRANSFER_GAS;
    }
}
