// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract PolicyKernel {
    struct Policy {
        uint16 maxSlippageBps;
        uint16 maxProtocolExposureBps;
        uint16 minLiquidReserveBps;
        uint32 maxLeverageBps;
        uint128 maxActionValue;
        bool paused;
    }

    mapping(address => Policy) public policies;
    mapping(address => mapping(address => bool)) public allowedAgents;
    mapping(address => mapping(address => bool)) public allowedTargets;

    event PolicyUpdated(address indexed owner);
    event AgentPermission(address indexed owner, address indexed agent, bool allowed);
    event TargetPermission(address indexed owner, address indexed target, bool allowed);

    function setPolicy(Policy calldata policy) external {
        require(policy.maxSlippageBps <= 5_000, "slippage");
        require(policy.maxProtocolExposureBps <= 10_000, "exposure");
        require(policy.minLiquidReserveBps <= 10_000, "reserve");
        require(policy.maxLeverageBps >= 10_000, "leverage");
        policies[msg.sender] = policy;
        emit PolicyUpdated(msg.sender);
    }

    function setAgent(address agent, bool allowed) external {
        allowedAgents[msg.sender][agent] = allowed;
        emit AgentPermission(msg.sender, agent, allowed);
    }

    function setTarget(address target, bool allowed) external {
        allowedTargets[msg.sender][target] = allowed;
        emit TargetPermission(msg.sender, target, allowed);
    }

    function validate(address owner, address agent, address target, uint256 value, uint256 slippageBps) external view returns (bool) {
        Policy memory p = policies[owner];
        return !p.paused && allowedAgents[owner][agent] && allowedTargets[owner][target] && value <= p.maxActionValue && slippageBps <= p.maxSlippageBps;
    }
}
