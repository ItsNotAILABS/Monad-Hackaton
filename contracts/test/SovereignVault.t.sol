// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PolicyKernel} from "../src/PolicyKernel.sol";
import {ReceiptChain} from "../src/ReceiptChain.sol";
import {SovereignVault} from "../src/SovereignVault.sol";
import {ThesisTypes} from "../src/ThesisTypes.sol";

contract MockTarget {
    uint256 public hits;

    receive() external payable {
        hits += 1;
    }

    function ping() external payable {
        hits += 1;
    }

    function boom() external pure {
        revert("boom");
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

        policy.setPolicyLegacy(50, 2000, 2500, 12500, 5 ether, false);
        policy.setAgent(owner, true);
        policy.setTarget(address(target), true);

        (bool ok,) = address(vault).call{value: 1 ether}("");
        require(ok, "fund");

        vault.execute(address(target), 0.1 ether, 10, abi.encodeWithSignature("ping()"));
        require(target.hits() == 1, "hit");
        require(receipts.latestReceipt(address(vault)) != bytes32(0), "receipt");
        require(receipts.receiptCount(address(vault)) == 1, "count");

        try vault.execute(address(target), 0, 9999, abi.encodeWithSignature("ping()")) {
            revert("slippage should fail");
        } catch {}
    }

    function testRejectsHighSlippage() public {
        PolicyKernel policy = new PolicyKernel();
        ReceiptChain receipts = new ReceiptChain();
        SovereignVault vault = new SovereignVault(address(this), address(policy), address(receipts));
        MockTarget target = new MockTarget();
        policy.setPolicyLegacy(50, 2000, 2500, 12500, 5 ether, false);
        policy.setAgent(address(this), true);
        policy.setTarget(address(target), true);

        try vault.execute(address(target), 0, 500, abi.encodeWithSignature("ping()")) {
            revert("should have reverted");
        } catch {}
    }

    function testExecuteWithGasAndReceiptChain() public {
        PolicyKernel policy = new PolicyKernel();
        ReceiptChain receipts = new ReceiptChain();
        SovereignVault vault = new SovereignVault(address(this), address(policy), address(receipts));
        MockTarget target = new MockTarget();
        policy.setPolicyLegacy(100, 2000, 2500, 12500, 5 ether, false);
        policy.setAgent(address(this), true);
        policy.setTarget(address(target), true);
        (bool ok,) = address(vault).call{value: 1 ether}("");
        require(ok);

        vault.executeWithGas(
            address(target), 0, 10, 86_000, 80_000, abi.encodeWithSignature("ping()")
        );
        require(target.hits() == 1);

        try vault.executeWithGas(
            address(target), 0, 10, 80_000 * 20, 80_000, abi.encodeWithSignature("ping()")
        ) {
            revert("fat gas should fail");
        } catch {}
    }

    function testEmergencyWithdraw() public {
        PolicyKernel policy = new PolicyKernel();
        ReceiptChain receipts = new ReceiptChain();
        SovereignVault vault = new SovereignVault(address(this), address(policy), address(receipts));
        (bool ok,) = address(vault).call{value: 1 ether}("");
        require(ok);
        uint256 before = address(this).balance;
        vault.emergencyWithdraw(payable(address(this)), 0.4 ether);
        require(address(this).balance == before + 0.4 ether);
    }

    function testFullPolicyStruct() public {
        PolicyKernel policy = new PolicyKernel();
        ThesisTypes.Policy memory p = ThesisTypes.Policy({
            maxSlippageBps: 50,
            maxProtocolExposureBps: 2000,
            minLiquidReserveBps: 2500,
            maxLeverageBps: 12500,
            maxActionValue: 5 ether,
            paused: false,
            requireSimulation: true,
            allowUnlimitedApproval: false
        });
        policy.setPolicy(p);
        ThesisTypes.Policy memory got = policy.policies(address(this));
        require(got.requireSimulation && !got.allowUnlimitedApproval);
    }

    receive() external payable {}
}
