// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PolicyKernel} from "../src/PolicyKernel.sol";
import {ThesisTypes} from "../src/ThesisTypes.sol";
import {GasHints} from "../src/libraries/GasHints.sol";
import {Hashing} from "../src/libraries/Hashing.sol";

contract PolicyKernelTest {
    function testPolicyAndPermissions() public {
        PolicyKernel k = new PolicyKernel();
        k.setPolicyLegacy(50, 2000, 2500, 12500, 1 ether, false);
        k.setAgent(address(this), true);
        k.setTarget(address(0xBEEF), true);
        require(k.validate(address(this), address(this), address(0xBEEF), 0.5 ether, 40));
        require(!k.validate(address(this), address(this), address(0xBEEF), 2 ether, 40));
        require(!k.validate(address(this), address(this), address(0xBEEF), 0.5 ether, 60));
    }

    function testFullPolicyAndAction() public {
        PolicyKernel k = new PolicyKernel();
        ThesisTypes.Policy memory p = ThesisTypes.Policy({
            maxSlippageBps: 50,
            maxProtocolExposureBps: 2000,
            minLiquidReserveBps: 2500,
            maxLeverageBps: 12500,
            maxActionValue: 10 ether,
            paused: false,
            requireSimulation: true,
            allowUnlimitedApproval: false
        });
        k.setPolicy(p);
        k.setAgent(address(this), true);
        k.setTarget(address(0xCAFE), true);
        k.setCategory(Hashing.categoryId("dex"), true);

        ThesisTypes.Action memory a = ThesisTypes.Action({
            agent: address(this),
            target: address(0xCAFE),
            value: 1 ether,
            slippageBps: 20,
            gasLimit: GasHints.recommendedGasLimit(80_000, 0),
            estimatedGas: 80_000,
            category: Hashing.categoryId("dex"),
            data: hex"01",
            deadline: block.timestamp + 1 hours
        });
        // validateAction takes calldata — use external self call pattern via kernel with memory via helper
        (bool ok, bytes32 reason) = this.callValidate(k, a);
        require(ok, string(abi.encodePacked(reason)));
    }

    function callValidate(PolicyKernel k, ThesisTypes.Action memory a)
        external
        view
        returns (bool, bytes32)
    {
        return k.validateAction(address(this), a);
    }

    function testDailyCap() public {
        PolicyKernel k = new PolicyKernel();
        k.setPolicyLegacy(50, 2000, 2500, 12500, 100 ether, false);
        k.setAgent(address(this), true);
        k.setTarget(address(0xBEEF), true);
        k.setDailySpendCap(1 ether);
        require(k.validate(address(this), address(this), address(0xBEEF), 0.5 ether, 10));
        k.recordSpend(address(this), 0.6 ether);
        require(!k.validate(address(this), address(this), address(0xBEEF), 0.5 ether, 10));
    }

    function testGasHints() public pure {
        require(GasHints.nativeTransferGas() == 21_000);
        uint256 lim = GasHints.recommendedGasLimit(80_000, 10_750);
        require(lim == 86_000);
        require(GasHints.isSaneGasLimit(lim, 80_000));
        require(!GasHints.isSaneGasLimit(80_000 * 20, 80_000));
    }
}
