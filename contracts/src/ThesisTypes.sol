// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title Shared types for THESIS Company OS + vault path
library ThesisTypes {
    /// @notice Owner financial / execution policy (mirrors engine Policy).
    struct Policy {
        uint16 maxSlippageBps; // e.g. 50 = 0.50%
        uint16 maxProtocolExposureBps; // e.g. 2000 = 20%
        uint16 minLiquidReserveBps; // e.g. 2500 = 25%
        uint32 maxLeverageBps; // 10_000 = 1x, 12_500 = 1.25x
        uint128 maxActionValue; // native units (wei)
        bool paused;
        bool requireSimulation;
        bool allowUnlimitedApproval; // default false — proto.exact-approval
    }

    /// @notice One agent-proposed action under owner policy.
    struct Action {
        address agent;
        address target;
        uint256 value;
        uint256 slippageBps;
        uint256 gasLimit; // Monad: user pays limit, not used
        uint256 estimatedGas;
        bytes32 category; // keccak256("dex") etc.
        bytes data;
        uint256 deadline;
    }

    /// @notice Hash-linked receipt spine entry.
    struct Receipt {
        bytes32 previousHash;
        bytes32 stateHash;
        bytes32 actionHash;
        address agent;
        address vault;
        uint64 timestamp;
        uint64 blockNumber;
        bool success;
    }

    enum ProposalStatus {
        Proposed,
        Simulated,
        Approved,
        Rejected,
        Executed,
        Failed,
        Cancelled
    }

    enum Department {
        THESIS, // GM
        SENSUS,
        MATHESIS,
        NOMOS,
        AGORA,
        PRAXIS,
        CUSTOS,
        ACADEMY,
        NERVUS,
        MEMORIA
    }

    /// @notice Onchain mirror of ecosystem law metadata (not executable by itself).
    struct LawRecord {
        bytes32 lawId; // e.g. keccak256("monad.gas-bills-limit")
        bytes32 pillar; // keccak256("safety"|"governance"|...)
        bytes32 severity; // keccak256("critical"|"high"|...)
        bytes32 domain; // keccak256("monad_network"|...)
        bool active;
        uint64 embeddedAt;
    }

    struct AgentProfile {
        bytes32 identity;
        bytes32 capabilities;
        uint64 expiresAt;
        bool active;
        uint32 reputation; // 0..1_000_000 scale optional
    }
}
