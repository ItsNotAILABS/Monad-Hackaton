// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IPolicyKernel { function validate(address owner, address agent, address target, uint256 value, uint256 slippageBps) external view returns (bool); }
interface IReceiptChain { function seal(address vault, bytes32 stateHash, bytes32 actionHash, address agent, bool success) external returns (bytes32); }

contract SovereignVault {
    address public immutable owner;
    IPolicyKernel public immutable policy;
    IReceiptChain public immutable receipts;
    uint256 private unlocked = 1;

    event Executed(address indexed agent, address indexed target, uint256 value, bytes32 actionHash, bool success);
    modifier onlyOwner(){ require(msg.sender == owner, "owner"); _; }
    modifier nonReentrant(){ require(unlocked == 1, "reentrant"); unlocked = 2; _; unlocked = 1; }

    constructor(address owner_, address policy_, address receipts_) { owner = owner_; policy = IPolicyKernel(policy_); receipts = IReceiptChain(receipts_); }
    receive() external payable {}

    function execute(address target, uint256 value, uint256 slippageBps, bytes calldata data) external nonReentrant returns (bytes memory result) {
        require(policy.validate(owner, msg.sender, target, value, slippageBps), "policy");
        bytes32 beforeHash = keccak256(abi.encode(address(this).balance, block.number));
        bytes32 actionHash = keccak256(abi.encode(target, value, slippageBps, data));
        (bool ok, bytes memory returned) = target.call{value:value}(data);
        receipts.seal(address(this), beforeHash, actionHash, msg.sender, ok);
        emit Executed(msg.sender, target, value, actionHash, ok);
        require(ok, "execution");
        return returned;
    }

    function emergencyWithdraw(address payable to, uint256 amount) external onlyOwner nonReentrant { require(to != address(0), "zero"); to.transfer(amount); }
}
