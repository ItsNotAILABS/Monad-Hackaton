// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
interface IVaultExec { function execute(address target,uint256 value,uint256 slippageBps,bytes calldata data) external returns(bytes memory); }
contract ExecutionRouter {
    event Routed(address indexed vault,address indexed target,uint256 value);
    function route(address vault,address target,uint256 value,uint256 slippageBps,bytes calldata data) external returns(bytes memory result){ result=IVaultExec(vault).execute(target,value,slippageBps,data); emit Routed(vault,target,value); }
}
