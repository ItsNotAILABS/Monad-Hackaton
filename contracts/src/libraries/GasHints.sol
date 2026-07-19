// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisErrors} from "../ThesisErrors.sol";
import {BpsMath} from "./BpsMath.sol";

/// @title Monad-aware gas helpers (library — pure views)
/// @dev On Monad, users pay gas_limit * price, not gas used.
///      Docs: https://docs.monad.xyz/developer-essentials/gas-pricing
library GasHints {
    uint256 internal constant NATIVE_TRANSFER_GAS = 21_000;
    /// @notice Recommended headroom ~7.5%
    uint256 internal constant DEFAULT_MARGIN_BPS = 10_750;
    /// @notice Reject limits that are absurdly fat vs estimate
    uint256 internal constant OVERSPEND_MULTIPLIER = 10;

    /// @notice Hardcode for pure native transfers — skip estimateGas.
    function nativeTransferGas() internal pure returns (uint256) {
        return NATIVE_TRANSFER_GAS;
    }

    /// @notice estimate * marginBps / 10_000
    function recommendedGasLimit(uint256 estimatedGas, uint256 marginBps)
        internal
        pure
        returns (uint256)
    {
        if (estimatedGas == 0) return NATIVE_TRANSFER_GAS;
        uint256 m = marginBps == 0 ? DEFAULT_MARGIN_BPS : marginBps;
        return BpsMath.applyMargin(estimatedGas, m);
    }

    /// @notice True if gasLimit is within sane band of estimate for Monad.
    function isSaneGasLimit(uint256 gasLimit, uint256 estimatedGas) internal pure returns (bool) {
        if (estimatedGas == 0) {
            // allow hardcoded native transfer
            return gasLimit == NATIVE_TRANSFER_GAS || gasLimit <= 100_000;
        }
        if (gasLimit < estimatedGas) return false;
        if (gasLimit > estimatedGas * OVERSPEND_MULTIPLIER) return false;
        return true;
    }

    function requireSaneGasLimit(uint256 gasLimit, uint256 estimatedGas) internal pure {
        if (!isSaneGasLimit(gasLimit, estimatedGas)) {
            revert ThesisErrors.InvalidGasLimit(gasLimit, estimatedGas);
        }
    }
}
