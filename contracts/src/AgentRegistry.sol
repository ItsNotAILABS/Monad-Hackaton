// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
contract AgentRegistry {
    struct Agent { bytes32 identity; bytes32 capabilities; uint64 expiresAt; bool active; }
    mapping(address => mapping(address => Agent)) public agents;
    event AgentRegistered(address indexed owner, address indexed agent, bytes32 identity, bytes32 capabilities, uint64 expiresAt);
    event AgentRevoked(address indexed owner, address indexed agent);
    function register(address agent, bytes32 identity, bytes32 capabilities, uint64 expiresAt) external { require(agent != address(0) && expiresAt > block.timestamp, "invalid"); agents[msg.sender][agent] = Agent(identity, capabilities, expiresAt, true); emit AgentRegistered(msg.sender, agent, identity, capabilities, expiresAt); }
    function revoke(address agent) external { agents[msg.sender][agent].active = false; emit AgentRevoked(msg.sender, agent); }
    function authorized(address owner, address agent) external view returns(bool){ Agent memory a=agents[owner][agent]; return a.active && a.expiresAt > block.timestamp; }
}
