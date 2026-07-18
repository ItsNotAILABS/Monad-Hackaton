// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "../src/PolicyKernel.sol";
contract PolicyKernelTest {
    function testPolicyAndPermissions() public {
        PolicyKernel k = new PolicyKernel();
        k.setPolicy(PolicyKernel.Policy(50,2000,2500,12500,1 ether,false));
        k.setAgent(address(this),true);
        k.setTarget(address(0xBEEF),true);
        require(k.validate(address(this),address(this),address(0xBEEF),0.5 ether,40));
        require(!k.validate(address(this),address(this),address(0xBEEF),2 ether,40));
        require(!k.validate(address(this),address(this),address(0xBEEF),0.5 ether,60));
    }
}
