// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReceiptChain} from "../src/ReceiptChain.sol";
import {AgentServiceMarket} from "../src/AgentServiceMarket.sol";

contract MarketActor {
    function publish(AgentServiceMarket market, string calldata name, string calldata metadataURI, bytes32 capability, uint96 price, uint32 slaSeconds) external returns (uint256) {
        return market.publishService(name, metadataURI, capability, price, slaSeconds);
    }
    function createJob(AgentServiceMarket market, uint256 serviceId, bytes32 requestHash) external payable returns (uint256) {
        return market.createJob{value: msg.value}(serviceId, requestHash);
    }
    function createBatch(AgentServiceMarket market, uint256[] calldata serviceIds, bytes32 requestHash) external payable returns (bytes32 teamId, uint256[] memory jobIds) {
        return market.createBatchJobs{value: msg.value}(serviceIds, requestHash);
    }
    function accept(AgentServiceMarket market, uint256 jobId) external { market.acceptJob(jobId); }
    function submit(AgentServiceMarket market, uint256 jobId, bytes32 resultHash, bytes32 stateHash, bytes32 actionHash) external returns (bytes32) {
        return market.submitResult(jobId, resultHash, stateHash, actionHash);
    }
    function approve(AgentServiceMarket market, uint256 jobId) external { market.approveAndRelease(jobId); }
    function dispute(AgentServiceMarket market, uint256 jobId) external { market.openDispute(jobId); }
    receive() external payable {}
}

contract AgentServiceMarketTest {
    ReceiptChain private receipts;
    AgentServiceMarket private market;
    MarketActor private providerA;
    MarketActor private providerB;
    MarketActor private client;
    uint96 private constant PRICE_A = 1 ether;
    uint96 private constant PRICE_B = 2 ether;

    constructor() payable {}

    function setUp() public {
        receipts = new ReceiptChain();
        market = new AgentServiceMarket(address(receipts), address(this), payable(address(this)), 250, 1 days);
        receipts.setSealer(address(market), true);
        receipts.setSealerGate(true);
        providerA = new MarketActor();
        providerB = new MarketActor();
        client = new MarketActor();
    }

    function testPublishFundExecuteAndSettle() public {
        setUp();
        uint256 serviceId = providerA.publish(market, "Risk audit", "ipfs://risk-audit-metadata", keccak256("risk.audit"), PRICE_A, 1 hours);
        uint256 jobId = client.createJob{value: PRICE_A}(market, serviceId, keccak256("audit request"));
        providerA.accept(market, jobId);
        bytes32 receiptHash = providerA.submit(market, jobId, keccak256("audit result"), keccak256("state"), keccak256("action"));
        require(receiptHash != bytes32(0), "receipt missing");
        require(receipts.latestReceipt(address(market)) == receiptHash, "receipt tip");
        uint256 beforeProvider = address(providerA).balance;
        client.approve(market, jobId);
        AgentServiceMarket.Job memory job = market.getJob(jobId);
        require(job.status == AgentServiceMarket.JobStatus.Completed, "not completed");
        require(address(providerA).balance > beforeProvider, "provider unpaid");
        require(market.accruedFees() == PRICE_A * 250 / 10_000, "fee mismatch");
        AgentServiceMarket.ProviderStats memory stats = market.getProviderStats(address(providerA));
        require(stats.completedJobs == 1, "completion not counted");
        require(stats.reputationBps == 10_000, "reputation mismatch");
    }

    function testBatchCreatesIndependentAgentJobs() public {
        setUp();
        uint256 first = providerA.publish(market, "Research", "ipfs://research", keccak256("research"), PRICE_A, 1 hours);
        uint256 second = providerB.publish(market, "Build", "ipfs://build", keccak256("build"), PRICE_B, 2 hours);
        uint256[] memory serviceIds = new uint256[](2);
        serviceIds[0] = first;
        serviceIds[1] = second;
        (bytes32 teamId, uint256[] memory jobIds) = client.createBatch{value: PRICE_A + PRICE_B}(market, serviceIds, keccak256("team objective"));
        require(teamId != bytes32(0), "team missing");
        require(jobIds.length == 2, "jobs missing");
        require(market.jobIdsByTeam(teamId).length == 2, "team index missing");
        require(market.getJob(jobIds[0]).provider == address(providerA), "provider A");
        require(market.getJob(jobIds[1]).provider == address(providerB), "provider B");
    }

    function testDisputeRefundsClientWhenGovernorRejectsResult() public {
        setUp();
        uint256 serviceId = providerA.publish(market, "Verifier", "ipfs://verifier", keccak256("verification"), PRICE_A, 1 hours);
        uint256 jobId = client.createJob{value: PRICE_A}(market, serviceId, keccak256("verify"));
        providerA.accept(market, jobId);
        providerA.submit(market, jobId, keccak256("bad result"), keccak256("state"), keccak256("action"));
        client.dispute(market, jobId);
        uint256 beforeClient = address(client).balance;
        market.resolveDispute(jobId, false);
        require(address(client).balance == beforeClient + PRICE_A, "client not refunded");
        require(market.getJob(jobId).status == AgentServiceMarket.JobStatus.Refunded, "not refunded");
        AgentServiceMarket.ProviderStats memory stats = market.getProviderStats(address(providerA));
        require(stats.refundedJobs == 1, "refund not counted");
        require(stats.reputationBps == 0, "reputation should be zero");
    }

    function testRejectsWrongPayment() public {
        setUp();
        uint256 serviceId = providerA.publish(market, "Oracle", "ipfs://oracle", keccak256("oracle"), PRICE_A, 1 hours);
        try client.createJob{value: PRICE_A - 1}(market, serviceId, keccak256("request")) { revert("wrong payment accepted"); } catch {}
    }

    receive() external payable {}
}
