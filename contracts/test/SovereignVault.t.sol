// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../src/PolicyKernel.sol";
import "../src/ReceiptChain.sol";
import "../src/SovereignVault.sol";

contract MockTarget {
    uint256 public hits;

    receive() external payable {
        hits += 1;
    }

    function ping() external payable {
        hits += 1;
    }
}

/// @dev Minimal forge-compatible tests without forge-std dependency.
contract SovereignVaultTest {
    function testAgentExecutesWhenLawful() public {
        address owner = address(this);
        PolicyKernel policy = new PolicyKernel();
        ReceiptChain receipts = new ReceiptChain();
        SovereignVault vault = new SovereignVault(owner, address(policy), address(receipts));
        MockTarget target = new MockTarget();

        policy.setPolicy(PolicyKernel.Policy(50, 2000, 2500, 12500, 5 ether, false));
        policy.setAgent(owner, true);
        policy.setTarget(address(target), true);

        // fund vault
        (bool ok, ) = address(vault).call{value: 1 ether}("");
        require(ok, "fund");

        vault.execute(address(target), 0.1 ether, 10, abi.encodeWithSignature("ping()"));
        require(target.hits() == 1, "hit");
        require(receipts.latestReceipt(address(vault)) != bytes32(0), "receipt");
    }

    function testRejectsHighSlippage() public {
        PolicyKernel policy = new PolicyKernel();
        ReceiptChain receipts = new ReceiptChain();
        SovereignVault vault = new SovereignVault(address(this), address(policy), address(receipts));
        MockTarget target = new MockTarget();
        policy.setPolicy(PolicyKernel.Policy(50, 2000, 2500, 12500, 5 ether, false));
        policy.setAgent(address(this), true);
        policy.setTarget(address(target), true);

        try vault.execute(address(target), 0, 500, abi.encodeWithSignature("ping()")) {
            revert("should have reverted");
        } catch {}
    }

    receive() external payable {}
}
