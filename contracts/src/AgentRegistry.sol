// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "./ThesisTypes.sol";
import {ThesisErrors} from "./ThesisErrors.sol";

/// @title AgentRegistry — owner-scoped agent identities & capabilities
contract AgentRegistry {
    mapping(address => mapping(address => ThesisTypes.AgentProfile)) public agents;
    mapping(address => address[]) private _agentList;

    event AgentRegistered(address indexed owner,address indexed agent,bytes32 identity,bytes32 capabilities,uint64 expiresAt);
    event AgentRevoked(address indexed owner,address indexed agent);
    event AgentReputation(address indexed owner,address indexed agent,uint32 reputation);

    function register(address agent,bytes32 identity,bytes32 capabilities,uint64 expiresAt) public {
        if (agent == address(0)) revert ThesisErrors.ZeroAddress();
        if (expiresAt <= block.timestamp) revert ThesisErrors.Expired(expiresAt);
        ThesisTypes.AgentProfile storage a = agents[msg.sender][agent];
        bool first = !a.active && a.expiresAt == 0 && a.identity == bytes32(0);
        a.identity = identity;
        a.capabilities = capabilities;
        a.expiresAt = expiresAt;
        a.active = true;
        if (first) _agentList[msg.sender].push(agent);
        emit AgentRegistered(msg.sender,agent,identity,capabilities,expiresAt);
    }

    function registerWithReputation(address agent,bytes32 identity,bytes32 capabilities,uint64 expiresAt,uint32 reputation) external {
        register(agent,identity,capabilities,expiresAt);
        agents[msg.sender][agent].reputation = reputation;
        emit AgentReputation(msg.sender,agent,reputation);
    }

    function renew(address agent,uint64 newExpiresAt) external {
        ThesisTypes.AgentProfile storage a = agents[msg.sender][agent];
        if (!a.active) revert ThesisErrors.NotFound();
        if (newExpiresAt <= block.timestamp) revert ThesisErrors.Expired(newExpiresAt);
        a.expiresAt = newExpiresAt;
        emit AgentRegistered(msg.sender,agent,a.identity,a.capabilities,newExpiresAt);
    }

    function revoke(address agent) external { agents[msg.sender][agent].active = false; emit AgentRevoked(msg.sender,agent); }
    function setReputation(address agent,uint32 reputation) external { if (!agents[msg.sender][agent].active) revert ThesisErrors.NotFound(); agents[msg.sender][agent].reputation = reputation; emit AgentReputation(msg.sender,agent,reputation); }
    function authorized(address owner,address agent) external view returns (bool) { ThesisTypes.AgentProfile memory a=agents[owner][agent]; return a.active&&a.expiresAt>block.timestamp; }
    function hasCapability(address owner,address agent,bytes32 capabilityBit) external view returns (bool) { ThesisTypes.AgentProfile memory a=agents[owner][agent]; if(!a.active||a.expiresAt<=block.timestamp)return false; return (uint256(a.capabilities)&uint256(capabilityBit))!=0; }
    function listAgents(address owner) external view returns (address[] memory) { return _agentList[owner]; }
    function getAgent(address owner,address agent) external view returns (ThesisTypes.AgentProfile memory) { return agents[owner][agent]; }
}
