// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ISovereignVault} from "./interfaces/ISovereignVault.sol";
import {ThesisErrors} from "./ThesisErrors.sol";

/// @title ExecutionRouter — thin multi-vault router for agents
contract ExecutionRouter {
    event Routed(
        address indexed vault, address indexed target, address indexed agent, uint256 value
    );
    event RoutedWithGas(
        address indexed vault, address indexed target, uint256 gasLimit, uint256 estimatedGas
    );

    function route(
        address vault,
        address target,
        uint256 value,
        uint256 slippageBps,
        bytes calldata data
    ) external returns (bytes memory result) {
        if (vault == address(0) || target == address(0)) revert ThesisErrors.ZeroAddress();
        result = ISovereignVault(vault).execute(target, value, slippageBps, data);
        emit Routed(vault, target, msg.sender, value);
    }

    function routeWithGas(
        address vault,
        address target,
        uint256 value,
        uint256 slippageBps,
        uint256 gasLimit,
        uint256 estimatedGas,
        bytes calldata data
    ) external returns (bytes memory result) {
        if (vault == address(0) || target == address(0)) revert ThesisErrors.ZeroAddress();
        result = ISovereignVault(vault).executeWithGas(
            target, value, slippageBps, gasLimit, estimatedGas, data
        );
        emit Routed(vault, target, msg.sender, value);
        emit RoutedWithGas(vault, target, gasLimit, estimatedGas);
    }

    function routeMany(
        address vault,
        address[] calldata targets,
        uint256[] calldata values,
        uint256[] calldata slipBps,
        bytes[] calldata datas
    ) external returns (bytes[] memory results) {
        uint256 n = targets.length;
        if (n == 0) revert ThesisErrors.ArrayEmpty();
        if (values.length != n || slipBps.length != n || datas.length != n) {
            revert ThesisErrors.LengthMismatch();
        }
        results = new bytes[](n);
        for (uint256 i = 0; i < n; ) {
            results[i] =
                ISovereignVault(vault).execute(targets[i], values[i], slipBps[i], datas[i]);
            emit Routed(vault, targets[i], msg.sender, values[i]);
            unchecked {
                ++i;
            }
        }
    }
}
