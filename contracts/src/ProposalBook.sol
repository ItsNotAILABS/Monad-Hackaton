// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "./ThesisTypes.sol";
import {ThesisErrors} from "./ThesisErrors.sol";

/// @title ProposalBook — agent proposals with simulation + approval lifecycle
contract ProposalBook {
    using ThesisTypes for ThesisTypes.ProposalStatus;

    struct Proposal {
        address owner;
        address agent;
        bytes32 actionHash;
        bytes32 simulationHash;
        bytes32 rejectReason;
        ThesisTypes.ProposalStatus status;
        uint64 createdAt;
        uint64 updatedAt;
        uint256 value;
        address target;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256[]) private _byOwner;

    event Proposed(
        uint256 indexed id,
        address indexed owner,
        address indexed agent,
        bytes32 actionHash,
        address target,
        uint256 value
    );
    event StatusChanged(
        uint256 indexed id, ThesisTypes.ProposalStatus status, bytes32 simulationHash, bytes32 reason
    );

    function propose(bytes32 actionHash) external returns (uint256 id) {
        return _propose(msg.sender, msg.sender, actionHash, address(0), 0);
    }

    function proposeFull(bytes32 actionHash, address target, uint256 value)
        external
        returns (uint256 id)
    {
        return _propose(msg.sender, msg.sender, actionHash, target, value);
    }

    function proposeAsAgent(address owner, bytes32 actionHash, address target, uint256 value)
        external
        returns (uint256 id)
    {
        // Agent proposes for owner — owner must later approve
        return _propose(owner, msg.sender, actionHash, target, value);
    }

    function setStatus(uint256 id, ThesisTypes.ProposalStatus status, bytes32 simulationHash)
        external
    {
        _setStatus(id, status, simulationHash, bytes32(0));
    }

    function reject(uint256 id, bytes32 reason) external {
        _setStatus(id, ThesisTypes.ProposalStatus.Rejected, bytes32(0), reason);
    }

    function markSimulated(uint256 id, bytes32 simulationHash) external {
        _setStatus(id, ThesisTypes.ProposalStatus.Simulated, simulationHash, bytes32(0));
    }

    function approve(uint256 id) external {
        Proposal storage p = proposals[id];
        if (msg.sender != p.owner) revert ThesisErrors.Unauthorized();
        if (
            p.status != ThesisTypes.ProposalStatus.Proposed
                && p.status != ThesisTypes.ProposalStatus.Simulated
        ) {
            revert ThesisErrors.BadStatus(uint8(p.status), uint8(ThesisTypes.ProposalStatus.Simulated));
        }
        p.status = ThesisTypes.ProposalStatus.Approved;
        p.updatedAt = uint64(block.timestamp);
        emit StatusChanged(id, p.status, p.simulationHash, bytes32(0));
    }

    function markExecuted(uint256 id, bool success) external {
        Proposal storage p = proposals[id];
        if (msg.sender != p.owner && msg.sender != p.agent) revert ThesisErrors.Unauthorized();
        p.status =
            success ? ThesisTypes.ProposalStatus.Executed : ThesisTypes.ProposalStatus.Failed;
        p.updatedAt = uint64(block.timestamp);
        emit StatusChanged(id, p.status, p.simulationHash, bytes32(0));
    }

    function cancel(uint256 id) external {
        Proposal storage p = proposals[id];
        if (msg.sender != p.owner) revert ThesisErrors.Unauthorized();
        p.status = ThesisTypes.ProposalStatus.Cancelled;
        p.updatedAt = uint64(block.timestamp);
        emit StatusChanged(id, p.status, p.simulationHash, bytes32(0));
    }

    function getProposal(uint256 id) external view returns (Proposal memory) {
        return proposals[id];
    }

    function proposalsOf(address owner) external view returns (uint256[] memory) {
        return _byOwner[owner];
    }

    function _propose(
        address owner,
        address agent,
        bytes32 actionHash,
        address target,
        uint256 value
    ) internal returns (uint256 id) {
        if (owner == address(0) || agent == address(0)) revert ThesisErrors.ZeroAddress();
        id = nextId++;
        proposals[id] = Proposal({
            owner: owner,
            agent: agent,
            actionHash: actionHash,
            simulationHash: bytes32(0),
            rejectReason: bytes32(0),
            status: ThesisTypes.ProposalStatus.Proposed,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            value: value,
            target: target
        });
        _byOwner[owner].push(id);
        emit Proposed(id, owner, agent, actionHash, target, value);
    }

    function _setStatus(
        uint256 id,
        ThesisTypes.ProposalStatus status,
        bytes32 simulationHash,
        bytes32 reason
    ) internal {
        Proposal storage p = proposals[id];
        if (p.createdAt == 0) revert ThesisErrors.NotFound();
        if (msg.sender != p.owner && msg.sender != p.agent) revert ThesisErrors.Unauthorized();
        p.status = status;
        if (simulationHash != bytes32(0)) p.simulationHash = simulationHash;
        if (reason != bytes32(0)) p.rejectReason = reason;
        p.updatedAt = uint64(block.timestamp);
        emit StatusChanged(id, status, p.simulationHash, reason);
    }
}
