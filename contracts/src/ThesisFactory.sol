// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PolicyKernel} from "./PolicyKernel.sol";
import {ReceiptChain} from "./ReceiptChain.sol";
import {SovereignVault} from "./SovereignVault.sol";
import {AgentRegistry} from "./AgentRegistry.sol";
import {ProposalBook} from "./ProposalBook.sol";
import {ExecutionRouter} from "./ExecutionRouter.sol";
import {LawBook} from "./LawBook.sol";
import {TwinLedger} from "./TwinLedger.sol";
import {CompanyRegistry} from "./CompanyRegistry.sol";
import {GasPolicy} from "./GasPolicy.sol";
import {ThesisMulticall} from "./ThesisMulticall.sol";
import {ExactAllowance} from "./ExactAllowance.sol";
import {ThesisErrors} from "./ThesisErrors.sol";

/// @title ThesisFactory — deploy a full THESIS stack for an owner
contract ThesisFactory {
    struct Bundle {
        address policy;
        address receipts;
        address vault;
        address agents;
        address proposals;
        address router;
        address lawBook;
        address twins;
        address company;
        address gasPolicy;
        address multicall;
        address exactAllowance;
    }

    event StackDeployed(address indexed owner, Bundle bundle);

    function deployStack(address owner) external returns (Bundle memory b) {
        if (owner == address(0)) revert ThesisErrors.ZeroAddress();

        PolicyKernel policy = new PolicyKernel();
        ReceiptChain receipts = new ReceiptChain();
        SovereignVault vault = new SovereignVault(owner, address(policy), address(receipts));
        AgentRegistry agents = new AgentRegistry();
        ProposalBook proposals = new ProposalBook();
        ExecutionRouter router = new ExecutionRouter();
        LawBook lawBook = new LawBook(owner);
        TwinLedger twins = new TwinLedger(owner);
        CompanyRegistry company = new CompanyRegistry();
        GasPolicy gasPolicy = new GasPolicy();
        ThesisMulticall multicall = new ThesisMulticall();
        ExactAllowance exactAllowance = new ExactAllowance(owner);

        // wire sealer for production-ish gate (optional)
        receipts.setSealer(address(vault), true);

        b = Bundle({
            policy: address(policy),
            receipts: address(receipts),
            vault: address(vault),
            agents: address(agents),
            proposals: address(proposals),
            router: address(router),
            lawBook: address(lawBook),
            twins: address(twins),
            company: address(company),
            gasPolicy: address(gasPolicy),
            multicall: address(multicall),
            exactAllowance: address(exactAllowance)
        });
        emit StackDeployed(owner, b);
    }
}
