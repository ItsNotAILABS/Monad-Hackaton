// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface ISovereignVault {
    function owner() external view returns (address);

    function execute(address target, uint256 value, uint256 slippageBps, bytes calldata data)
        external
        returns (bytes memory result);

    function executeWithGas(
        address target,
        uint256 value,
        uint256 slippageBps,
        uint256 gasLimit,
        uint256 estimatedGas,
        bytes calldata data
    ) external returns (bytes memory result);

    function emergencyWithdraw(address payable to, uint256 amount) external;
}
