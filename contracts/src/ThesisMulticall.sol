// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisErrors} from "./ThesisErrors.sol";

/// @title ThesisMulticall — aggregate eth_call style reads (view/static)
/// @notice Prefer canonical Multicall3 at 0xcA11… when available on Monad.
///         This helper is for THESIS-local batched view probes.
contract ThesisMulticall {
    struct Call {
        address target;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    /// @notice Sequential aggregate — same caveats as Multicall3 serial execution.
    function aggregate(Call[] calldata calls)
        external
        returns (uint256 blockNumber, Result[] memory returnData)
    {
        blockNumber = block.number;
        uint256 n = calls.length;
        returnData = new Result[](n);
        for (uint256 i = 0; i < n; ) {
            (bool ok, bytes memory ret) = calls[i].target.call(calls[i].callData);
            returnData[i] = Result(ok, ret);
            unchecked {
                ++i;
            }
        }
    }

    function tryAggregate(bool requireSuccess, Call[] calldata calls)
        external
        returns (Result[] memory returnData)
    {
        uint256 n = calls.length;
        returnData = new Result[](n);
        for (uint256 i = 0; i < n; ) {
            (bool ok, bytes memory ret) = calls[i].target.call(calls[i].callData);
            if (requireSuccess && !ok) revert ThesisErrors.CallFailed();
            returnData[i] = Result(ok, ret);
            unchecked {
                ++i;
            }
        }
    }

    function getBlockHash(uint256 blockNumber) external view returns (bytes32) {
        return blockhash(blockNumber);
    }

    function getCurrentBlockTimestamp() external view returns (uint256) {
        return block.timestamp;
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }

    function getEthBalance(address addr) external view returns (uint256) {
        return addr.balance;
    }
}
