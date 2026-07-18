// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Policy gate for agent execution.
interface IPolicyKernel {
    function validate(
        address owner,
        address agent,
        address target,
        uint256 value,
        uint256 slippageBps
    ) external view returns (bool);
}

/// @notice Hash-linked on-chain receipt spine.
interface IReceiptChain {
    function seal(
        address vault,
        bytes32 stateHash,
        bytes32 actionHash,
        address agent,
        bool success
    ) external returns (bytes32);
}

/// @title SovereignVault — THESIS primary Spark submission contract
/// @notice Agents may call execute only when PolicyKernel.validate passes.
///         Owner retains emergencyWithdraw. Not audited — testnet / alpha only.
contract SovereignVault {
    address public immutable owner;
    IPolicyKernel public immutable policy;
    IReceiptChain public immutable receipts;
    uint256 private unlocked = 1;

    event Executed(
        address indexed agent,
        address indexed target,
        uint256 value,
        bytes32 actionHash,
        bool success,
        bytes32 receiptHash
    );
    event EmergencyWithdraw(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "owner");
        _;
    }

    modifier nonReentrant() {
        require(unlocked == 1, "reentrant");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    constructor(address owner_, address policy_, address receipts_) {
        require(owner_ != address(0) && policy_ != address(0) && receipts_ != address(0), "zero");
        owner = owner_;
        policy = IPolicyKernel(policy_);
        receipts = IReceiptChain(receipts_);
    }

    receive() external payable {}

    /// @notice Policy-gated call. Unlawful agents / targets / slippage / value revert.
    function execute(
        address target,
        uint256 value,
        uint256 slippageBps,
        bytes calldata data
    ) external nonReentrant returns (bytes memory result) {
        require(policy.validate(owner, msg.sender, target, value, slippageBps), "policy");
        bytes32 beforeHash = keccak256(abi.encode(address(this).balance, block.number, msg.sender));
        bytes32 actionHash = keccak256(abi.encode(target, value, slippageBps, keccak256(data)));
        (bool ok, bytes memory returned) = target.call{value: value}(data);
        bytes32 receiptHash = receipts.seal(address(this), beforeHash, actionHash, msg.sender, ok);
        emit Executed(msg.sender, target, value, actionHash, ok, receiptHash);
        require(ok, "execution");
        return returned;
    }

    function emergencyWithdraw(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "zero");
        require(amount <= address(this).balance, "balance");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "xfer");
        emit EmergencyWithdraw(to, amount);
    }
}
