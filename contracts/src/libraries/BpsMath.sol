// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisErrors} from "../ThesisErrors.sol";

/// @title Basis-point math helpers (10_000 = 100%)
library BpsMath {
    uint256 internal constant BPS = 10_000;

    function mulBps(uint256 amount, uint256 bps) internal pure returns (uint256) {
        if (bps > BPS) revert ThesisErrors.InvalidBps(bps);
        return (amount * bps) / BPS;
    }

    function applyMargin(uint256 estimate, uint256 marginBps) internal pure returns (uint256) {
        // e.g. 10_750 = +7.5% headroom for Monad gas_limit
        if (marginBps < BPS) revert ThesisErrors.InvalidBps(marginBps);
        return (estimate * marginBps) / BPS;
    }

    function isWithinSlippage(uint256 expected, uint256 actual, uint256 maxSlippageBps)
        internal
        pure
        returns (bool)
    {
        if (expected == 0) return actual == 0;
        uint256 diff = expected > actual ? expected - actual : actual - expected;
        return diff * BPS <= expected * maxSlippageBps;
    }
}
