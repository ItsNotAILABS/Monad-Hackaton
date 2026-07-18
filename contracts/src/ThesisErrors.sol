// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title Shared custom errors for THESIS contracts
library ThesisErrors {
    error ZeroAddress();
    error Unauthorized();
    error Paused();
    error Reentrancy();
    error InvalidPolicy();
    error PolicyRejected();
    error AgentNotAllowed();
    error TargetNotAllowed();
    error SlippageTooHigh(uint256 given, uint256 maxBps);
    error ValueTooHigh(uint256 given, uint256 maxValue);
    error Expired(uint64 expiresAt);
    error BadStatus(uint8 got, uint8 want);
    error InsufficientBalance(uint256 have, uint256 need);
    error CallFailed();
    error InvalidBps(uint256 bps);
    error InvalidGasLimit(uint256 gasLimit, uint256 estimated);
    error UnlimitedApprovalForbidden();
    error BlobTxUnsupported();
    error AlreadySealed();
    error NotFound();
    error LengthMismatch();
    error CategoryNotAllowed(bytes32 category);
    error ReserveViolation(uint256 remaining, uint256 minReserve);
    error ArrayEmpty();
    error DeadlineExpired(uint256 deadline);
}
