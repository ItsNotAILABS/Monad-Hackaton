// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IReceiptChain} from "./interfaces/IReceiptChain.sol";
import {ReentrancyGuard} from "./libraries/ReentrancyGuard.sol";

/// @title AgentServiceMarket
/// @notice Native-MON service registry, job escrow, proof settlement, and provider reputation.
/// @dev Providers may be EOAs, smart accounts, or autonomous agent wallets.
contract AgentServiceMarket is ReentrancyGuard {
    enum JobStatus { None, Funded, Accepted, Submitted, Disputed, Completed, Refunded }

    struct Service {
        address provider;
        string name;
        string metadataURI;
        bytes32 capability;
        uint96 price;
        uint32 slaSeconds;
        bool active;
    }

    struct Job {
        uint256 serviceId;
        address client;
        address provider;
        uint96 payment;
        uint64 createdAt;
        uint64 acceptedAt;
        uint64 executionDeadline;
        uint64 reviewDeadline;
        JobStatus status;
        bytes32 requestHash;
        bytes32 resultHash;
        bytes32 receiptHash;
    }

    struct ProviderStats {
        uint64 completedJobs;
        uint64 refundedJobs;
        uint128 grossRevenue;
        uint32 reputationBps;
    }

    error ZeroAddress();
    error Unauthorized();
    error InvalidConfiguration();
    error InvalidService();
    error InvalidPayment(uint256 expected, uint256 actual);
    error InvalidStatus(JobStatus current, JobStatus required);
    error DeadlinePassed(uint256 deadline);
    error TooEarly(uint256 readyAt);
    error TransferFailed();
    error EmptyBatch();

    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 private constant MAX_PROTOCOL_FEE_BPS = 1_000;

    IReceiptChain public immutable receiptChain;
    address public governor;
    address payable public treasury;
    uint16 public protocolFeeBps;
    uint32 public reviewPeriodSeconds;
    uint256 public serviceCount;
    uint256 public jobCount;
    uint256 public accruedFees;

    mapping(uint256 => Service) private _services;
    mapping(uint256 => Job) private _jobs;
    mapping(address => uint256[]) private _providerServiceIds;
    mapping(address => uint256[]) private _clientJobIds;
    mapping(bytes32 => uint256[]) private _teamJobIds;
    mapping(address => ProviderStats) public providerStats;

    event GovernanceTransferred(address indexed previousGovernor, address indexed nextGovernor);
    event TreasuryUpdated(address indexed treasury);
    event ProtocolConfigurationUpdated(uint16 protocolFeeBps, uint32 reviewPeriodSeconds);
    event ServicePublished(uint256 indexed serviceId, address indexed provider, bytes32 indexed capability, uint96 price, uint32 slaSeconds, string name, string metadataURI);
    event ServiceUpdated(uint256 indexed serviceId, uint96 price, uint32 slaSeconds, bool active, string metadataURI);
    event JobFunded(uint256 indexed jobId, uint256 indexed serviceId, address indexed client, address provider, uint96 payment, bytes32 requestHash);
    event TeamFunded(bytes32 indexed teamId, address indexed client, uint256[] jobIds, uint256 totalPayment, bytes32 requestHash);
    event JobAccepted(uint256 indexed jobId, address indexed provider, uint64 executionDeadline);
    event JobSubmitted(uint256 indexed jobId, address indexed provider, bytes32 resultHash, bytes32 receiptHash, uint64 reviewDeadline);
    event JobDisputed(uint256 indexed jobId, address indexed client);
    event JobCompleted(uint256 indexed jobId, address indexed provider, uint256 providerPayment, uint256 protocolFee);
    event JobRefunded(uint256 indexed jobId, address indexed client, uint256 payment);
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    modifier onlyGovernor() {
        if (msg.sender != governor) revert Unauthorized();
        _;
    }

    modifier onlyTreasuryOrGovernor() {
        if (msg.sender != treasury && msg.sender != governor) revert Unauthorized();
        _;
    }

    constructor(address receiptChainAddress, address initialGovernor, address payable initialTreasury, uint16 initialProtocolFeeBps, uint32 initialReviewPeriodSeconds) {
        if (receiptChainAddress == address(0) || initialGovernor == address(0) || initialTreasury == address(0)) revert ZeroAddress();
        if (initialProtocolFeeBps > MAX_PROTOCOL_FEE_BPS || initialReviewPeriodSeconds == 0) revert InvalidConfiguration();
        receiptChain = IReceiptChain(receiptChainAddress);
        governor = initialGovernor;
        treasury = initialTreasury;
        protocolFeeBps = initialProtocolFeeBps;
        reviewPeriodSeconds = initialReviewPeriodSeconds;
    }

    function transferGovernance(address nextGovernor) external onlyGovernor {
        if (nextGovernor == address(0)) revert ZeroAddress();
        address previous = governor;
        governor = nextGovernor;
        emit GovernanceTransferred(previous, nextGovernor);
    }

    function setTreasury(address payable nextTreasury) external onlyGovernor {
        if (nextTreasury == address(0)) revert ZeroAddress();
        treasury = nextTreasury;
        emit TreasuryUpdated(nextTreasury);
    }

    function setProtocolConfiguration(uint16 nextFeeBps, uint32 nextReviewPeriodSeconds) external onlyGovernor {
        if (nextFeeBps > MAX_PROTOCOL_FEE_BPS || nextReviewPeriodSeconds == 0) revert InvalidConfiguration();
        protocolFeeBps = nextFeeBps;
        reviewPeriodSeconds = nextReviewPeriodSeconds;
        emit ProtocolConfigurationUpdated(nextFeeBps, nextReviewPeriodSeconds);
    }

    function publishService(string calldata name, string calldata metadataURI, bytes32 capability, uint96 price, uint32 slaSeconds) external returns (uint256 serviceId) {
        if (bytes(name).length == 0 || bytes(metadataURI).length == 0 || capability == bytes32(0) || price == 0 || slaSeconds == 0) revert InvalidConfiguration();
        serviceId = ++serviceCount;
        _services[serviceId] = Service(msg.sender, name, metadataURI, capability, price, slaSeconds, true);
        _providerServiceIds[msg.sender].push(serviceId);
        emit ServicePublished(serviceId, msg.sender, capability, price, slaSeconds, name, metadataURI);
    }

    function updateService(uint256 serviceId, string calldata metadataURI, uint96 price, uint32 slaSeconds, bool active) external {
        Service storage service = _services[serviceId];
        if (service.provider == address(0)) revert InvalidService();
        if (service.provider != msg.sender) revert Unauthorized();
        if (bytes(metadataURI).length == 0 || price == 0 || slaSeconds == 0) revert InvalidConfiguration();
        service.metadataURI = metadataURI;
        service.price = price;
        service.slaSeconds = slaSeconds;
        service.active = active;
        emit ServiceUpdated(serviceId, price, slaSeconds, active, metadataURI);
    }

    function setServiceActive(uint256 serviceId, bool active) external {
        Service storage service = _services[serviceId];
        if (service.provider == address(0)) revert InvalidService();
        if (service.provider != msg.sender) revert Unauthorized();
        service.active = active;
        emit ServiceUpdated(serviceId, service.price, service.slaSeconds, active, service.metadataURI);
    }

    function createJob(uint256 serviceId, bytes32 requestHash) external payable returns (uint256 jobId) {
        Service memory service = _requireActiveService(serviceId);
        if (msg.value != service.price) revert InvalidPayment(service.price, msg.value);
        jobId = _createJob(serviceId, service, requestHash);
    }

    function createBatchJobs(uint256[] calldata serviceIds, bytes32 requestHash) external payable returns (bytes32 teamId, uint256[] memory jobIds) {
        uint256 length = serviceIds.length;
        if (length == 0) revert EmptyBatch();
        Service[] memory services = new Service[](length);
        uint256 totalPayment;
        for (uint256 i; i < length; ++i) {
            services[i] = _requireActiveService(serviceIds[i]);
            totalPayment += services[i].price;
        }
        if (msg.value != totalPayment) revert InvalidPayment(totalPayment, msg.value);
        teamId = keccak256(abi.encode(msg.sender, requestHash, block.chainid, jobCount, serviceIds));
        jobIds = new uint256[](length);
        for (uint256 i; i < length; ++i) {
            bytes32 scopedRequestHash = keccak256(abi.encode(requestHash, teamId, serviceIds[i], i));
            jobIds[i] = _createJob(serviceIds[i], services[i], scopedRequestHash);
        }
        _teamJobIds[teamId] = jobIds;
        emit TeamFunded(teamId, msg.sender, jobIds, totalPayment, requestHash);
    }

    function acceptJob(uint256 jobId) external {
        Job storage job = _requireJob(jobId);
        if (job.provider != msg.sender) revert Unauthorized();
        if (job.status != JobStatus.Funded) revert InvalidStatus(job.status, JobStatus.Funded);
        Service memory service = _services[job.serviceId];
        job.acceptedAt = uint64(block.timestamp);
        job.executionDeadline = uint64(block.timestamp + service.slaSeconds);
        job.status = JobStatus.Accepted;
        emit JobAccepted(jobId, msg.sender, job.executionDeadline);
    }

    function submitResult(uint256 jobId, bytes32 resultHash, bytes32 stateHash, bytes32 actionHash) external returns (bytes32 receiptHash) {
        Job storage job = _requireJob(jobId);
        if (job.provider != msg.sender) revert Unauthorized();
        if (job.status != JobStatus.Accepted) revert InvalidStatus(job.status, JobStatus.Accepted);
        if (block.timestamp > job.executionDeadline) revert DeadlinePassed(job.executionDeadline);
        if (resultHash == bytes32(0)) revert InvalidConfiguration();
        receiptHash = receiptChain.seal(address(this), keccak256(abi.encode(jobId, stateHash)), keccak256(abi.encode(jobId, actionHash, resultHash)), msg.sender, true);
        job.resultHash = resultHash;
        job.receiptHash = receiptHash;
        job.reviewDeadline = uint64(block.timestamp + reviewPeriodSeconds);
        job.status = JobStatus.Submitted;
        emit JobSubmitted(jobId, msg.sender, resultHash, receiptHash, job.reviewDeadline);
    }

    function approveAndRelease(uint256 jobId) external nonReentrant {
        Job storage job = _requireJob(jobId);
        if (job.client != msg.sender) revert Unauthorized();
        if (job.status != JobStatus.Submitted) revert InvalidStatus(job.status, JobStatus.Submitted);
        _release(jobId, job);
    }

    function claimAfterReview(uint256 jobId) external nonReentrant {
        Job storage job = _requireJob(jobId);
        if (job.provider != msg.sender) revert Unauthorized();
        if (job.status != JobStatus.Submitted) revert InvalidStatus(job.status, JobStatus.Submitted);
        if (block.timestamp <= job.reviewDeadline) revert TooEarly(job.reviewDeadline + 1);
        _release(jobId, job);
    }

    function openDispute(uint256 jobId) external {
        Job storage job = _requireJob(jobId);
        if (job.client != msg.sender) revert Unauthorized();
        if (job.status != JobStatus.Submitted) revert InvalidStatus(job.status, JobStatus.Submitted);
        if (block.timestamp > job.reviewDeadline) revert DeadlinePassed(job.reviewDeadline);
        job.status = JobStatus.Disputed;
        emit JobDisputed(jobId, msg.sender);
    }

    function resolveDispute(uint256 jobId, bool providerWins) external onlyGovernor nonReentrant {
        Job storage job = _requireJob(jobId);
        if (job.status != JobStatus.Disputed) revert InvalidStatus(job.status, JobStatus.Disputed);
        if (providerWins) _release(jobId, job); else _refund(jobId, job);
    }

    function cancelFundedJob(uint256 jobId) external nonReentrant {
        Job storage job = _requireJob(jobId);
        if (job.client != msg.sender) revert Unauthorized();
        if (job.status != JobStatus.Funded) revert InvalidStatus(job.status, JobStatus.Funded);
        _refund(jobId, job);
    }

    function refundExpiredJob(uint256 jobId) external nonReentrant {
        Job storage job = _requireJob(jobId);
        if (job.client != msg.sender) revert Unauthorized();
        uint256 deadline;
        if (job.status == JobStatus.Funded) deadline = uint256(job.createdAt) + _services[job.serviceId].slaSeconds;
        else if (job.status == JobStatus.Accepted) deadline = job.executionDeadline;
        else revert InvalidStatus(job.status, JobStatus.Accepted);
        if (block.timestamp <= deadline) revert TooEarly(deadline + 1);
        _refund(jobId, job);
    }

    function withdrawFees(address payable recipient, uint256 amount) external onlyTreasuryOrGovernor nonReentrant {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount > accruedFees) revert InvalidPayment(accruedFees, amount);
        accruedFees -= amount;
        _sendValue(recipient, amount);
        emit FeesWithdrawn(recipient, amount);
    }

    function getService(uint256 serviceId) external view returns (Service memory) {
        Service memory service = _services[serviceId];
        if (service.provider == address(0)) revert InvalidService();
        return service;
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        Job storage job = _requireJob(jobId);
        return job;
    }

    function getProviderStats(address provider) external view returns (ProviderStats memory) { return providerStats[provider]; }
    function serviceIdsByProvider(address provider) external view returns (uint256[] memory) { return _providerServiceIds[provider]; }
    function jobIdsByClient(address client) external view returns (uint256[] memory) { return _clientJobIds[client]; }
    function jobIdsByTeam(bytes32 teamId) external view returns (uint256[] memory) { return _teamJobIds[teamId]; }

    function _createJob(uint256 serviceId, Service memory service, bytes32 requestHash) internal returns (uint256 jobId) {
        if (requestHash == bytes32(0)) revert InvalidConfiguration();
        jobId = ++jobCount;
        _jobs[jobId] = Job(serviceId, msg.sender, service.provider, service.price, uint64(block.timestamp), 0, 0, 0, JobStatus.Funded, requestHash, bytes32(0), bytes32(0));
        _clientJobIds[msg.sender].push(jobId);
        emit JobFunded(jobId, serviceId, msg.sender, service.provider, service.price, requestHash);
    }

    function _release(uint256 jobId, Job storage job) internal {
        uint256 payment = job.payment;
        uint256 fee = payment * protocolFeeBps / BPS_DENOMINATOR;
        uint256 providerPayment = payment - fee;
        job.status = JobStatus.Completed;
        accruedFees += fee;
        ProviderStats storage stats = providerStats[job.provider];
        stats.completedJobs += 1;
        stats.grossRevenue += uint128(providerPayment);
        _refreshReputation(stats);
        _sendValue(payable(job.provider), providerPayment);
        emit JobCompleted(jobId, job.provider, providerPayment, fee);
    }

    function _refund(uint256 jobId, Job storage job) internal {
        uint256 payment = job.payment;
        job.status = JobStatus.Refunded;
        ProviderStats storage stats = providerStats[job.provider];
        stats.refundedJobs += 1;
        _refreshReputation(stats);
        _sendValue(payable(job.client), payment);
        emit JobRefunded(jobId, job.client, payment);
    }

    function _refreshReputation(ProviderStats storage stats) internal {
        uint256 total = uint256(stats.completedJobs) + uint256(stats.refundedJobs);
        stats.reputationBps = total == 0 ? 0 : uint32(uint256(stats.completedJobs) * BPS_DENOMINATOR / total);
    }

    function _requireActiveService(uint256 serviceId) internal view returns (Service memory service) {
        service = _services[serviceId];
        if (service.provider == address(0) || !service.active) revert InvalidService();
    }

    function _requireJob(uint256 jobId) internal view returns (Job storage job) {
        job = _jobs[jobId];
        if (job.client == address(0)) revert InvalidService();
    }

    function _sendValue(address payable recipient, uint256 amount) internal {
        (bool ok,) = recipient.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
