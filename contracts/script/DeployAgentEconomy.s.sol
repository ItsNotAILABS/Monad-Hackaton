// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {ReceiptChain} from "../src/ReceiptChain.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {AgentServiceMarket} from "../src/AgentServiceMarket.sol";
import {AgentCredentialNFT} from "../src/AgentCredentialNFT.sol";

/// @notice Deploys the on-chain agent service economy using environment-supplied governance.
contract DeployAgentEconomy is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address governor = vm.envAddress("DEPLOYER_OWNER");
        address payable treasury = payable(vm.envAddress("PROTOCOL_TREASURY"));
        uint256 feeBps = vm.envUint("PROTOCOL_FEE_BPS");
        uint256 reviewPeriod = vm.envUint("JOB_REVIEW_PERIOD_SECONDS");
        address receiptAddress = vm.envOr("RECEIPT_CHAIN_ADDRESS", address(0));
        address registryAddress = vm.envOr("AGENT_REGISTRY_ADDRESS", address(0));
        bool configureExistingReceiptChain = vm.envOr("CONFIGURE_RECEIPT_SEALER", false);
        string memory credentialName = vm.envOr("AGENT_CREDENTIAL_NAME", string("THESIS Agent Credentials"));
        string memory credentialSymbol = vm.envOr("AGENT_CREDENTIAL_SYMBOL", string("TAC"));
        require(feeBps <= type(uint16).max, "fee overflow");
        require(reviewPeriod <= type(uint32).max, "review overflow");

        vm.startBroadcast(privateKey);
        bool deployedReceiptChain = receiptAddress == address(0);
        if (deployedReceiptChain) receiptAddress = address(new ReceiptChain());
        if (registryAddress == address(0)) registryAddress = address(new AgentRegistry());
        AgentServiceMarket market = new AgentServiceMarket(
            receiptAddress,
            governor,
            treasury,
            uint16(feeBps),
            uint32(reviewPeriod)
        );
        AgentCredentialNFT credentials = new AgentCredentialNFT(
            address(market), governor, credentialName, credentialSymbol
        );
        if (deployedReceiptChain || configureExistingReceiptChain) {
            ReceiptChain(receiptAddress).setSealer(address(market), true);
        }
        vm.stopBroadcast();

        console2.log("CHAIN_ID", block.chainid);
        console2.log("DEPLOYER_OWNER", governor);
        console2.log("PROTOCOL_TREASURY", treasury);
        console2.log("RECEIPT_CHAIN_ADDRESS", receiptAddress);
        console2.log("AGENT_REGISTRY_ADDRESS", registryAddress);
        console2.log("AGENT_MARKET_ADDRESS", address(market));
        console2.log("AGENT_CREDENTIAL_ADDRESS", address(credentials));
        console2.log("PROTOCOL_FEE_BPS", feeBps);
        console2.log("JOB_REVIEW_PERIOD_SECONDS", reviewPeriod);
    }
}
