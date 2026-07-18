// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20Minimal} from "./interfaces/IERC20Minimal.sol";
import {ThesisErrors} from "./ThesisErrors.sol";

/// @title ExactAllowance — proto.exact-approval helper (no unlimited approves)
/// @notice Pulls tokens only with exact allowance; rejects type(uint256).max patterns.
contract ExactAllowance {
    address public immutable owner;

    event ExactApproved(address indexed token, address indexed spender, uint256 amount);
    event ExactPulled(address indexed token, address indexed from, address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert ThesisErrors.Unauthorized();
        _;
    }

    constructor(address owner_) {
        if (owner_ == address(0)) revert ThesisErrors.ZeroAddress();
        owner = owner_;
    }

    /// @notice Approve exact amount only.
    function approveExact(address token, address spender, uint256 amount) external onlyOwner {
        if (token == address(0) || spender == address(0)) revert ThesisErrors.ZeroAddress();
        if (amount == type(uint256).max) revert ThesisErrors.UnlimitedApprovalForbidden();
        // reset then set for USDT-like tokens
        IERC20Minimal(token).approve(spender, 0);
        bool ok = IERC20Minimal(token).approve(spender, amount);
        if (!ok) revert ThesisErrors.CallFailed();
        emit ExactApproved(token, spender, amount);
    }

    function pullExact(address token, address from, address to, uint256 amount) external onlyOwner {
        if (token == address(0) || from == address(0) || to == address(0)) {
            revert ThesisErrors.ZeroAddress();
        }
        uint256 allow = IERC20Minimal(token).allowance(from, address(this));
        if (allow < amount) revert ThesisErrors.InsufficientBalance(allow, amount);
        if (allow == type(uint256).max) revert ThesisErrors.UnlimitedApprovalForbidden();
        bool ok = IERC20Minimal(token).transferFrom(from, to, amount);
        if (!ok) revert ThesisErrors.CallFailed();
        emit ExactPulled(token, from, to, amount);
    }

    function revoke(address token, address spender) external onlyOwner {
        IERC20Minimal(token).approve(spender, 0);
        emit ExactApproved(token, spender, 0);
    }
}
