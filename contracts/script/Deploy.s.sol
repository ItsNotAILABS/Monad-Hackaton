// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {PolicyKernel} from "../src/PolicyKernel.sol";
import {ReceiptChain} from "../src/ReceiptChain.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {ProposalBook} from "../src/ProposalBook.sol";
import {ExecutionRouter} from "../src/ExecutionRouter.sol";
import {SovereignVault} from "../src/SovereignVault.sol";
import {LawBook} from "../src/LawBook.sol";
import {TwinLedger} from "../src/TwinLedger.sol";
import {CompanyRegistry} from "../src/CompanyRegistry.sol";
import {GasPolicy} from "../src/GasPolicy.sol";
import {ThesisMulticall} from "../src/ThesisMulticall.sol";
import {ExactAllowance} from "../src/ExactAllowance.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";

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
        LawBook lawBook = new LawBook(owner);
        lawBook.seedDefaultLaws();
        TwinLedger twins = new TwinLedger(owner);
        CompanyRegistry company = new CompanyRegistry();
        GasPolicy gasPolicy = new GasPolicy();
        ThesisMulticall multicall = new ThesisMulticall();
        ExactAllowance exactAllowance = new ExactAllowance(owner);
        ThesisFactory factory = new ThesisFactory();

        receipts.setSealer(address(vault), true);
        policy.setLawBook(address(lawBook));
        // optional: enable sealer gate after vault wired
        // receipts.setSealerGate(true);

        vm.stopBroadcast();

        console2.log("chainId", block.chainid);
        console2.log("owner", owner);
        console2.log("PolicyKernel", address(policy));
        console2.log("ReceiptChain", address(receipts));
        console2.log("AgentRegistry", address(agents));
        console2.log("ProposalBook", address(proposals));
        console2.log("ExecutionRouter", address(router));
        console2.log("SovereignVault", address(vault));
        console2.log("LawBook", address(lawBook));
        console2.log("TwinLedger", address(twins));
        console2.log("CompanyRegistry", address(company));
        console2.log("GasPolicy", address(gasPolicy));
        console2.log("ThesisMulticall", address(multicall));
        console2.log("ExactAllowance", address(exactAllowance));
        console2.log("ThesisFactory", address(factory));
        console2.log("PRIMARY_SUBMISSION_ADDRESS", address(vault));
    }
}
