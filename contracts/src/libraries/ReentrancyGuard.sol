// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisErrors} from "../ThesisErrors.sol";

/// @title Minimal reentrancy guard (abstract)
abstract contract ReentrancyGuard {
    uint256 private _status = 1;

    modifier nonReentrant() {
        if (_status != 1) revert ThesisErrors.Reentrancy();
        _status = 2;
        _;
        _status = 1;
    }
}
