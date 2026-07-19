// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "./ThesisTypes.sol";
import {ThesisErrors} from "./ThesisErrors.sol";

/// @title CompanyRegistry — onchain HQ metadata for Company OS missions
contract CompanyRegistry {
    struct Mission {
        address owner;
        bytes32 objectiveHash;
        ThesisTypes.Department winnerDept;
        bytes32 winnerAgent;
        uint8 status; // 0=open 1=awaiting 2=approved 3=rejected 4=done
        uint64 createdAt;
        uint64 closedAt;
        bytes32 lawStackHash;
    }

    uint256 public nextMissionId = 1;
    mapping(uint256 => Mission) public missions;
    mapping(address => uint256[]) private _ownerMissions;
    mapping(address => bytes32) public constitutionHash; // owner constitution commit

    event ConstitutionCommitted(address indexed owner, bytes32 hash);
    event MissionOpened(
        uint256 indexed id, address indexed owner, bytes32 objectiveHash, bytes32 lawStackHash
    );
    event MissionClosed(uint256 indexed id, uint8 status, ThesisTypes.Department winnerDept);

    function commitConstitution(bytes32 hash) external {
        constitutionHash[msg.sender] = hash;
        emit ConstitutionCommitted(msg.sender, hash);
    }

    function openMission(bytes32 objectiveHash, bytes32 lawStackHash)
        external
        returns (uint256 id)
    {
        id = nextMissionId++;
        missions[id] = Mission({
            owner: msg.sender,
            objectiveHash: objectiveHash,
            winnerDept: ThesisTypes.Department.THESIS,
            winnerAgent: bytes32(0),
            status: 0,
            createdAt: uint64(block.timestamp),
            closedAt: 0,
            lawStackHash: lawStackHash
        });
        _ownerMissions[msg.sender].push(id);
        emit MissionOpened(id, msg.sender, objectiveHash, lawStackHash);
    }

    function setAwaiting(uint256 id, ThesisTypes.Department winnerDept, bytes32 winnerAgent)
        external
    {
        Mission storage m = missions[id];
        if (m.owner != msg.sender) revert ThesisErrors.Unauthorized();
        m.status = 1;
        m.winnerDept = winnerDept;
        m.winnerAgent = winnerAgent;
    }

    function approve(uint256 id) external {
        Mission storage m = missions[id];
        if (m.owner != msg.sender) revert ThesisErrors.Unauthorized();
        m.status = 2;
        m.closedAt = uint64(block.timestamp);
        emit MissionClosed(id, m.status, m.winnerDept);
    }

    function reject(uint256 id) external {
        Mission storage m = missions[id];
        if (m.owner != msg.sender) revert ThesisErrors.Unauthorized();
        m.status = 3;
        m.closedAt = uint64(block.timestamp);
        emit MissionClosed(id, m.status, m.winnerDept);
    }

    function complete(uint256 id) external {
        Mission storage m = missions[id];
        if (m.owner != msg.sender) revert ThesisErrors.Unauthorized();
        m.status = 4;
        m.closedAt = uint64(block.timestamp);
        emit MissionClosed(id, m.status, m.winnerDept);
    }

    function missionsOf(address owner) external view returns (uint256[] memory) {
        return _ownerMissions[owner];
    }
}
