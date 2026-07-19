// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MonadDApp
/// @notice Deployed by MonadBuilder+ — no-code dApp builder on Monad Testnet
contract MonadDApp {
    string public appName;
    string public publishedSlug;
    address public owner;
    uint256 public deployedAt;

    event DAppDeployed(string appName, string publishedSlug, address indexed owner, uint256 deployedAt);

    constructor(string memory _appName, string memory _slug) {
        appName = _appName;
        publishedSlug = _slug;
        owner = msg.sender;
        deployedAt = block.timestamp;
        emit DAppDeployed(_appName, _slug, msg.sender, block.timestamp);
    }

    function getInfo() external view returns (
        string memory name_,
        string memory slug_,
        address owner_,
        uint256 deployedAt_
    ) {
        return (appName, publishedSlug, owner, deployedAt);
    }
}
