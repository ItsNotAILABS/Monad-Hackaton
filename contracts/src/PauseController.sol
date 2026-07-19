// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisErrors} from "./ThesisErrors.sol";

/// @title PauseController — shared pause flag for modules that opt in
contract PauseController {
    address public guardian;
    address public admin;
    bool public paused;

    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event GuardianUpdated(address indexed guardian);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert ThesisErrors.Unauthorized();
        _;
    }

    modifier onlyGuardian() {
        if (msg.sender != guardian && msg.sender != admin) revert ThesisErrors.Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ThesisErrors.Paused();
        _;
    }

    constructor(address admin_, address guardian_) {
        if (admin_ == address(0)) revert ThesisErrors.ZeroAddress();
        admin = admin_;
        guardian = guardian_ == address(0) ? admin_ : guardian_;
    }

    function setGuardian(address g) external onlyAdmin {
        if (g == address(0)) revert ThesisErrors.ZeroAddress();
        guardian = g;
        emit GuardianUpdated(g);
    }

    function pause() external onlyGuardian {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyAdmin {
        paused = false;
        emit Unpaused(msg.sender);
    }
}
