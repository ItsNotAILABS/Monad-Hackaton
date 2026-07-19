// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "../ThesisTypes.sol";

interface IPolicyKernel {
    function validate(
        address owner,
        address agent,
        address target,
        uint256 value,
        uint256 slippageBps
    ) external view returns (bool);

    function validateAction(address owner, ThesisTypes.Action calldata action)
        external
        view
        returns (bool ok, bytes32 reason);

    function policies(address owner)
        external
        view
        returns (
            uint16 maxSlippageBps,
            uint16 maxProtocolExposureBps,
            uint16 minLiquidReserveBps,
            uint32 maxLeverageBps,
            uint128 maxActionValue,
            bool paused,
            bool requireSimulation,
            bool allowUnlimitedApproval
        );
}
