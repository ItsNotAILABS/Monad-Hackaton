// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {LawBook} from "../src/LawBook.sol";
import {Hashing} from "../src/libraries/Hashing.sol";
import {TwinLedger} from "../src/TwinLedger.sol";
import {CompanyRegistry} from "../src/CompanyRegistry.sol";
import {GasPolicy} from "../src/GasPolicy.sol";
import {ThesisMulticall} from "../src/ThesisMulticall.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {ProposalBook} from "../src/ProposalBook.sol";
import {ThesisTypes} from "../src/ThesisTypes.sol";

contract LawBookAndModulesTest {
    function testSeedLawsAndPillars() public {
        LawBook book = new LawBook(address(this));
        book.seedDefaultLaws();
        require(book.lawCount() >= 20, "count");
        require(book.isActiveString("monad.gas-bills-limit"), "gas law");
        require(book.isActiveString("sys.no-real-keys"), "keys law");
        require(book.isActiveString("exec.no-silent-broadcast"), "exec law");
        bytes32 safety = Hashing.lawId("safety");
        require(book.lawsForPillar(safety).length >= 3, "safety pillar");
        bytes32 domain = Hashing.lawId("monad_network");
        require(book.lawsForDomain(domain).length >= 3, "domain");
        ThesisTypes.LawRecord memory rec = book.getLawByString("sys.nomos-veto");
        require(rec.active, "nomos veto active");
    }

    function testTwinLedger() public {
        TwinLedger twins = new TwinLedger(address(this));
        bytes32 mon = twins.assetIdFromSymbol("MON");
        twins.setTwin(address(0xBEEF), mon, 1e18, keccak256("sync"));
        twins.applyDelta(address(0xBEEF), mon, -2e17);
        require(twins.balanceOf(address(0xBEEF), "MON") == 8e17);
    }

    function testCompanyMissionLifecycle() public {
        CompanyRegistry co = new CompanyRegistry();
        co.commitConstitution(keccak256("const-v1"));
        uint256 id = co.openMission(keccak256("grow mon"), keccak256("laws"));
        co.setAwaiting(id, ThesisTypes.Department.AGORA, keccak256("yield-agent"));
        co.approve(id);
        (,,,,, uint8 status,,) = co.missions(id);
        require(status == 2, "approved");
    }

    function testGasPolicyAndMulticall() public {
        GasPolicy g = new GasPolicy();
        require(g.recommend(80_000) == 86_000);
        require(g.isSane(86_000, 80_000));
        require(g.nativeTransferGas() == 21_000);

        ThesisMulticall mc = new ThesisMulticall();
        require(mc.getChainId() > 0);
        require(mc.getCurrentBlockTimestamp() > 0);
    }

    function testAgentAndProposal() public {
        AgentRegistry reg = new AgentRegistry();
        reg.register(address(0xA11CE), keccak256("id"), bytes32(uint256(1)), uint64(block.timestamp + 30 days));
        require(reg.authorized(address(this), address(0xA11CE)));

        ProposalBook book = new ProposalBook();
        uint256 id = book.proposeFull(keccak256("act"), address(0xBEEF), 1 ether);
        book.markSimulated(id, keccak256("sim"));
        book.approve(id);
        book.markExecuted(id, true);
        ProposalBook.Proposal memory p = book.getProposal(id);
        require(p.status == ThesisTypes.ProposalStatus.Executed);
    }
}
