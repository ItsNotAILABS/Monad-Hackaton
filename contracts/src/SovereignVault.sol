// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPolicyKernel} from "./interfaces/IPolicyKernel.sol";
import {IReceiptChain} from "./interfaces/IReceiptChain.sol";
import {IERC20Minimal} from "./interfaces/IERC20Minimal.sol";
import {ThesisErrors} from "./ThesisErrors.sol";
import {ThesisTypes} from "./ThesisTypes.sol";
import {Hashing} from "./libraries/Hashing.sol";
import {GasHints} from "./libraries/GasHints.sol";

/// @title SovereignVault — THESIS primary Spark submission contract
/// @notice Agents may call execute only when PolicyKernel.validate passes.
///         Owner retains emergencyWithdraw / ERC20 rescue. Not audited — testnet / alpha.
contract SovereignVault {
    address public immutable owner;
    IPolicyKernel public immutable policy;
    IReceiptChain public immutable receipts;

    uint256 private unlocked = 1;
    mapping(address => bool) public operators; // optional secondary callers owner-managed
    uint256 public executionCount;

    event Executed(
        address indexed agent,
        address indexed target,
        uint256 value,
        bytes32 actionHash,
        bool success,
        bytes32 receiptHash
    );
    event EmergencyWithdraw(address indexed to, uint256 amount);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);
    event OperatorUpdated(address indexed operator, bool allowed);
    event BatchExecuted(uint256 n, uint256 successCount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert ThesisErrors.Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (unlocked != 1) revert ThesisErrors.Reentrancy();
        unlocked = 2;
        _;
        unlocked = 1;
    }

    constructor(address owner_, address policy_, address receipts_) {
        if (owner_ == address(0) || policy_ == address(0) || receipts_ == address(0)) {
            revert ThesisErrors.ZeroAddress();
        }
        owner = owner_;
        policy = IPolicyKernel(policy_);
        receipts = IReceiptChain(receipts_);
    }

    receive() external payable {}

    function setOperator(address operator, bool allowed) external onlyOwner {
        if (operator == address(0)) revert ThesisErrors.ZeroAddress();
        operators[operator] = allowed;
        emit OperatorUpdated(operator, allowed);
    }

    /// @notice Policy-gated call. Unlawful agents / targets / slippage / value revert.
    function execute(address target, uint256 value, uint256 slippageBps, bytes calldata data)
        external
        nonReentrant
        returns (bytes memory result)
    {
        return _execute(msg.sender, target, value, slippageBps, 0, 0, data);
    }

    /// @notice Same as execute but enforces Monad-sane gasLimit vs estimate.
    function executeWithGas(
        address target,
        uint256 value,
        uint256 slippageBps,
        uint256 gasLimit,
        uint256 estimatedGas,
        bytes calldata data
    ) external nonReentrant returns (bytes memory result) {
        GasHints.requireSaneGasLimit(gasLimit, estimatedGas);
        return _execute(msg.sender, target, value, slippageBps, gasLimit, estimatedGas, data);
    }

    /// @notice Structured action path.
    function executeAction(ThesisTypes.Action calldata action)
        external
        nonReentrant
        returns (bytes memory result)
    {
        if (action.agent != msg.sender && msg.sender != owner && !operators[msg.sender]) {
            revert ThesisErrors.Unauthorized();
        }
        if (action.deadline != 0 && block.timestamp > action.deadline) {
            revert ThesisErrors.DeadlineExpired(action.deadline);
        }
        if (action.gasLimit != 0 || action.estimatedGas != 0) {
            GasHints.requireSaneGasLimit(action.gasLimit, action.estimatedGas);
        }
        (bool ok, bytes32 reason) = policy.validateAction(owner, action);
        if (!ok) revert ThesisErrors.PolicyRejected();
        // silence unused in some solc paths
        reason;
        return _executeUnchecked(
            action.agent, action.target, action.value, action.slippageBps, action.data
        );
    }

    /// @notice Batch sequential executes (independent targets). Stops on first failure if stopOnFail.
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        uint256[] calldata slippageBps,
        bytes[] calldata datas,
        bool stopOnFail
    ) external nonReentrant returns (uint256 successCount) {
        uint256 n = targets.length;
        if (n == 0) revert ThesisErrors.ArrayEmpty();
        if (values.length != n || slippageBps.length != n || datas.length != n) {
            revert ThesisErrors.LengthMismatch();
        }
        for (uint256 i = 0; i < n; ) {
            // re-enter internal path without nonReentrant re-entry (already locked)
            try this.executeExternal(msg.sender, targets[i], values[i], slippageBps[i], datas[i]) {
                unchecked {
                    ++successCount;
                }
            } catch {
                if (stopOnFail) {
                    emit BatchExecuted(n, successCount);
                    revert ThesisErrors.CallFailed();
                }
            }
            unchecked {
                ++i;
            }
        }
        emit BatchExecuted(n, successCount);
    }

    /// @dev External wrapper so batch can try/catch policy+call while reentrancy lock held by parent.
    function executeExternal(
        address agent,
        address target,
        uint256 value,
        uint256 slippageBps,
        bytes calldata data
    ) external returns (bytes memory) {
        if (msg.sender != address(this)) revert ThesisErrors.Unauthorized();
        return _execute(agent, target, value, slippageBps, 0, 0, data);
    }

    function emergencyWithdraw(address payable to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ThesisErrors.ZeroAddress();
        if (amount > address(this).balance) {
            revert ThesisErrors.InsufficientBalance(address(this).balance, amount);
        }
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert ThesisErrors.CallFailed();
        emit EmergencyWithdraw(to, amount);
    }

    function rescueERC20(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(0) || to == address(0)) revert ThesisErrors.ZeroAddress();
        bool ok = IERC20Minimal(token).transfer(to, amount);
        if (!ok) revert ThesisErrors.CallFailed();
        emit TokenRescued(token, to, amount);
    }

    function recommendedGasLimit(uint256 estimatedGas) external pure returns (uint256) {
        return GasHints.recommendedGasLimit(estimatedGas, GasHints.DEFAULT_MARGIN_BPS);
    }

    function nativeTransferGas() external pure returns (uint256) {
        return GasHints.NATIVE_TRANSFER_GAS;
    }

    // ── internal ─────────────────────────────────────────────────

    function _execute(
        address agent,
        address target,
        uint256 value,
        uint256 slippageBps,
        uint256, /* gasLimit */
        uint256, /* estimatedGas */
        bytes calldata data
    ) internal returns (bytes memory result) {
        if (!policy.validate(owner, agent, target, value, slippageBps)) {
            revert ThesisErrors.PolicyRejected();
        }
        return _executeUnchecked(agent, target, value, slippageBps, data);
    }

    function _executeUnchecked(
        address agent,
        address target,
        uint256 value,
        uint256 slippageBps,
        bytes memory data
    ) internal returns (bytes memory result) {
        if (target == address(0)) revert ThesisErrors.ZeroAddress();
        if (value > address(this).balance) {
            revert ThesisErrors.InsufficientBalance(address(this).balance, value);
        }

        bytes32 beforeHash =
            keccak256(abi.encode(address(this).balance, block.number, agent, executionCount));
        bytes32 actionHash_ = Hashing.actionHashBytes(agent, target, value, slippageBps, data);

        (bool ok, bytes memory returned) = target.call{value: value}(data);
        bytes32 receiptHash = receipts.seal(address(this), beforeHash, actionHash_, agent, ok);

        unchecked {
            ++executionCount;
        }
        emit Executed(agent, target, value, actionHash_, ok, receiptHash);
        if (!ok) revert ThesisErrors.CallFailed();
        return returned;
    }
}
