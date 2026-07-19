// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "../ThesisTypes.sol";

/// @title ILawBook — ecosystem law registry (dual stack: ecosystem half)
interface ILawBook {
    function curator() external view returns (address);
    function lawCount() external view returns (uint256);
    function isActive(bytes32 lawId) external view returns (bool);
    function isActiveString(string calldata id) external view returns (bool);
    function getLaw(bytes32 lawId) external view returns (ThesisTypes.LawRecord memory);
    function lawsForPillar(bytes32 pillar) external view returns (bytes32[] memory);
    function lawsForDomain(bytes32 domain) external view returns (bytes32[] memory);
    function allLawIds() external view returns (bytes32[] memory);
}
