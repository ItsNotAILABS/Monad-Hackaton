// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {PolicyKernel} from "../src/PolicyKernel.sol";
import {ReceiptChain} from "../src/ReceiptChain.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {ProposalBook} from "../src/ProposalBook.sol";
import {ExecutionRouter} from "../src/ExecutionRouter.sol";
import {SovereignVault} from "../src/SovereignVault.sol";

/// @notice Monad-native THESIS kernel deploy (testnet 10143 / mainnet 143).
/// Docs: https://docs.monad.xyz/guides/deploy-smart-contract/foundry
contract Deploy is Script {
    function run() external {
        address owner = vm.envOr("DEPLOYER_OWNER", msg.sender);
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        PolicyKernel policy = new PolicyKernel();
        ReceiptChain receipts = new ReceiptChain();
        AgentRegistry agents = new AgentRegistry();
        ProposalBook proposals = new ProposalBook();
        ExecutionRouter router = new ExecutionRouter();
        SovereignVault vault = new SovereignVault(owner, address(policy), address(receipts));

        vm.stopBroadcast();

        console2.log("chainId", block.chainid);
        console2.log("owner", owner);
        console2.log("PolicyKernel", address(policy));
        console2.log("ReceiptChain", address(receipts));
        console2.log("AgentRegistry", address(agents));
        console2.log("ProposalBook", address(proposals));
        console2.log("ExecutionRouter", address(router));
        console2.log("SovereignVault", address(vault));
        console2.log("PRIMARY_SUBMISSION_ADDRESS", address(vault));
    }
}
