// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "./ThesisTypes.sol";
import {ThesisErrors} from "./ThesisErrors.sol";
import {Hashing} from "./libraries/Hashing.sol";
import {GasHints} from "./libraries/GasHints.sol";

/// @title PolicyKernel — owner laws for agent execution (NOMOS onchain)
/// @notice Each owner stores their own Policy + agent/target/category allowlists.
/// @dev Dual law stack:
///      - This contract = owner constitution (slippage, exposure, caps, allowlists)
///      - LawBook = platform-wide ecosystem laws (gas, sandbox, veto, exact approval…)
///      Python `policy.evaluate` + `ecosystem_laws` mirror both halves off-chain for NOMOS arena.
contract PolicyKernel {
    using Hashing for string;

    /// @notice Optional LawBook registry (ecosystem half). Not required for validate();
    ///         integrators / UIs consult it for dual-stack audit. Owner sets per-kernel.
    address public lawBook;

    mapping(address => ThesisTypes.Policy) private _policies;
    mapping(address => mapping(address => bool)) public allowedAgents;
    mapping(address => mapping(address => bool)) public allowedTargets;
    mapping(address => mapping(bytes32 => bool)) public allowedCategories;
    /// @notice Optional per-owner daily spend accounting (native wei, same day UTC-ish by day index)
    mapping(address => uint256) public daySpend;
    mapping(address => uint32) public dayIndex;
    mapping(address => uint128) public dailySpendCap; // 0 = unlimited

    event PolicyUpdated(address indexed owner, ThesisTypes.Policy policy);
    event AgentPermission(address indexed owner, address indexed agent, bool allowed);
    event TargetPermission(address indexed owner, address indexed target, bool allowed);
    event CategoryPermission(address indexed owner, bytes32 indexed category, bool allowed);
    event DailyCapUpdated(address indexed owner, uint128 cap);
    event SpendRecorded(address indexed owner, uint256 amount, uint32 day);
    event LawBookLinked(address indexed lawBook);

    // ── writes ───────────────────────────────────────────────────

    /// @notice Link the ecosystem LawBook used for dual-stack documentation / integrators.
    function setLawBook(address lawBook_) external {
        lawBook = lawBook_;
        emit LawBookLinked(lawBook_);
    }

    function setPolicy(ThesisTypes.Policy calldata policy) external {
        _validatePolicyShape(policy);
        _policies[msg.sender] = policy;
        emit PolicyUpdated(msg.sender, policy);
    }

    /// @notice Backward-compatible compact setter used by early tests / UI.
    function setPolicyLegacy(
        uint16 maxSlippageBps,
        uint16 maxProtocolExposureBps,
        uint16 minLiquidReserveBps,
        uint32 maxLeverageBps,
        uint128 maxActionValue,
        bool paused
    ) external {
        ThesisTypes.Policy memory p = ThesisTypes.Policy({
            maxSlippageBps: maxSlippageBps,
            maxProtocolExposureBps: maxProtocolExposureBps,
            minLiquidReserveBps: minLiquidReserveBps,
            maxLeverageBps: maxLeverageBps,
            maxActionValue: maxActionValue,
            paused: paused,
            requireSimulation: true,
            allowUnlimitedApproval: false
        });
        _validatePolicyShape(p);
        _policies[msg.sender] = p;
        emit PolicyUpdated(msg.sender, p);
    }

    function setAgent(address agent, bool allowed) external {
        if (agent == address(0)) revert ThesisErrors.ZeroAddress();
        allowedAgents[msg.sender][agent] = allowed;
        emit AgentPermission(msg.sender, agent, allowed);
    }

    function setAgentsBatch(address[] calldata agents, bool allowed) external {
        uint256 n = agents.length;
        if (n == 0) revert ThesisErrors.ArrayEmpty();
        for (uint256 i = 0; i < n; ) {
            if (agents[i] == address(0)) revert ThesisErrors.ZeroAddress();
            allowedAgents[msg.sender][agents[i]] = allowed;
            emit AgentPermission(msg.sender, agents[i], allowed);
            unchecked {
                ++i;
            }
        }
    }

    function setTarget(address target, bool allowed) external {
        if (target == address(0)) revert ThesisErrors.ZeroAddress();
        allowedTargets[msg.sender][target] = allowed;
        emit TargetPermission(msg.sender, target, allowed);
    }

    function setTargetsBatch(address[] calldata targets, bool allowed) external {
        uint256 n = targets.length;
        if (n == 0) revert ThesisErrors.ArrayEmpty();
        for (uint256 i = 0; i < n; ) {
            if (targets[i] == address(0)) revert ThesisErrors.ZeroAddress();
            allowedTargets[msg.sender][targets[i]] = allowed;
            emit TargetPermission(msg.sender, targets[i], allowed);
            unchecked {
                ++i;
            }
        }
    }

    function setCategory(bytes32 category, bool allowed) external {
        allowedCategories[msg.sender][category] = allowed;
        emit CategoryPermission(msg.sender, category, allowed);
    }

    function setCategoryString(string calldata category, bool allowed) external {
        bytes32 id = Hashing.categoryId(category);
        allowedCategories[msg.sender][id] = allowed;
        emit CategoryPermission(msg.sender, id, allowed);
    }

    function setDailySpendCap(uint128 cap) external {
        dailySpendCap[msg.sender] = cap;
        emit DailyCapUpdated(msg.sender, cap);
    }

    /// @notice Vault may record spend after successful execute (optional integration).
    function recordSpend(address owner, uint256 amount) external {
        // Only trusted callers in full deploy — open for testnet simplicity; production should gate.
        uint32 day = uint32(block.timestamp / 1 days);
        if (dayIndex[owner] != day) {
            dayIndex[owner] = day;
            daySpend[owner] = 0;
        }
        daySpend[owner] += amount;
        emit SpendRecorded(owner, amount, day);
    }

    // ── views ────────────────────────────────────────────────────

    function policies(address owner) external view returns (ThesisTypes.Policy memory) {
        return _policies[owner];
    }

    /// @notice Compact validate — kept for SovereignVault / IPolicyKernel.
    function validate(address owner, address agent, address target, uint256 value, uint256 slippageBps)
        external
        view
        returns (bool)
    {
        (bool ok,) = _validate(owner, agent, target, value, slippageBps, bytes32(0), 0, 0, 0);
        return ok;
    }

    function validateAction(address owner, ThesisTypes.Action calldata action)
        external
        view
        returns (bool ok, bytes32 reason)
    {
        if (action.deadline != 0 && block.timestamp > action.deadline) {
            return (false, bytes32("deadline"));
        }
        if (action.gasLimit != 0 || action.estimatedGas != 0) {
            if (!GasHints.isSaneGasLimit(action.gasLimit, action.estimatedGas)) {
                return (false, bytes32("gas_limit"));
            }
        }
        return _validate(
            owner,
            action.agent,
            action.target,
            action.value,
            action.slippageBps,
            action.category,
            action.gasLimit,
            action.estimatedGas,
            action.deadline
        );
    }

    function quoteRejection(address owner, address agent, address target, uint256 value, uint256 slippageBps)
        external
        view
        returns (bytes32 reason)
    {
        (, reason) = _validate(owner, agent, target, value, slippageBps, bytes32(0), 0, 0, 0);
    }

    // ── internal ─────────────────────────────────────────────────

    function _validatePolicyShape(ThesisTypes.Policy memory policy) internal pure {
        if (policy.maxSlippageBps > 5_000) revert ThesisErrors.InvalidPolicy();
        if (policy.maxProtocolExposureBps > 10_000) revert ThesisErrors.InvalidPolicy();
        if (policy.minLiquidReserveBps > 10_000) revert ThesisErrors.InvalidPolicy();
        if (policy.maxLeverageBps < 10_000) revert ThesisErrors.InvalidPolicy();
    }

    function _validate(
        address owner,
        address agent,
        address target,
        uint256 value,
        uint256 slippageBps,
        bytes32 category,
        uint256, /* gasLimit */
        uint256, /* estimatedGas */
        uint256 /* deadline */
    ) internal view returns (bool ok, bytes32 reason) {
        ThesisTypes.Policy memory p = _policies[owner];
        if (p.paused) return (false, bytes32("paused"));
        if (!allowedAgents[owner][agent]) return (false, bytes32("agent"));
        if (!allowedTargets[owner][target]) return (false, bytes32("target"));
        if (value > p.maxActionValue) return (false, bytes32("value"));
        if (slippageBps > p.maxSlippageBps) return (false, bytes32("slippage"));
        if (category != bytes32(0) && !allowedCategories[owner][category]) {
            // if owner never set categories, empty map means deny only when they use categories
            // soft: only enforce when at least one category flag exists — skip for simplicity: if category set, must be allowed
            return (false, bytes32("category"));
        }
        uint128 cap = dailySpendCap[owner];
        if (cap != 0) {
            uint32 day = uint32(block.timestamp / 1 days);
            uint256 spent = dayIndex[owner] == day ? daySpend[owner] : 0;
            if (spent + value > cap) return (false, bytes32("daily_cap"));
        }
        return (true, bytes32(0));
    }
}
