// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "./ThesisTypes.sol";
import {ThesisErrors} from "./ThesisErrors.sol";
import {Hashing} from "./libraries/Hashing.sol";

/// @title LawBook — on-chain ecosystem law registry (dual law stack half)
/// @notice Source of truth for platform-wide rules consulted by NOMOS / PolicyKernel
///         integrators and mirrored at runtime by `ecosystem_laws.py`.
/// @dev Owner constitution lives in PolicyKernel (per-owner). Ecosystem laws live here.
///      Doctrine: Agents propose. Laws decide. Owner signs. Receipts remember.
///
///      Structure:
///        pillars:  safety | governance | execution | intelligence
///        severity: critical | high | medium
///        domains:  system_self | monad_network | protocols | intelligence | execution
contract LawBook {
    address public curator;
    uint256 public lawCount;
    mapping(bytes32 => ThesisTypes.LawRecord) public laws;
    bytes32[] public lawIds;
    mapping(bytes32 => bytes32[]) private _byPillar; // pillar => lawIds
    mapping(bytes32 => bytes32[]) private _byDomain; // domain => lawIds

    event LawEmbedded(bytes32 indexed lawId, bytes32 pillar, bytes32 severity, bytes32 domain);
    event LawToggled(bytes32 indexed lawId, bool active);
    event CuratorUpdated(address indexed curator);

    modifier onlyCurator() {
        if (msg.sender != curator) revert ThesisErrors.Unauthorized();
        _;
    }

    constructor(address curator_) {
        if (curator_ == address(0)) revert ThesisErrors.ZeroAddress();
        curator = curator_;
    }

    function setCurator(address next) external onlyCurator {
        if (next == address(0)) revert ThesisErrors.ZeroAddress();
        curator = next;
        emit CuratorUpdated(next);
    }

    function embedLaw(
        string calldata id,
        string calldata pillar,
        string calldata severity,
        string calldata domain
    ) external onlyCurator returns (bytes32 lawId) {
        lawId = Hashing.lawId(id);
        _write(lawId, Hashing.lawId(pillar), Hashing.lawId(severity), Hashing.lawId(domain));
    }

    function embedLawsBatch(
        string[] calldata ids,
        string[] calldata pillars,
        string[] calldata severities,
        string[] calldata domains
    ) external onlyCurator {
        uint256 n = ids.length;
        if (n == 0) revert ThesisErrors.ArrayEmpty();
        if (pillars.length != n || severities.length != n || domains.length != n) {
            revert ThesisErrors.LengthMismatch();
        }
        for (uint256 i = 0; i < n; ) {
            _seed(ids[i], pillars[i], severities[i], domains[i]);
            unchecked {
                ++i;
            }
        }
    }

    /// @dev Raw embed without string conversion for seed scripts / integrators.
    function embedLawRaw(bytes32 lawId, bytes32 pillar, bytes32 severity, bytes32 domain)
        external
        onlyCurator
    {
        _write(lawId, pillar, severity, domain);
    }

    function setActive(bytes32 lawId, bool active) external onlyCurator {
        if (laws[lawId].embeddedAt == 0) revert ThesisErrors.NotFound();
        laws[lawId].active = active;
        emit LawToggled(lawId, active);
    }

    function isActive(bytes32 lawId) external view returns (bool) {
        return laws[lawId].active;
    }

    function isActiveString(string calldata id) external view returns (bool) {
        return laws[Hashing.lawId(id)].active;
    }

    /// @notice Full law record for audit UIs / off-chain indexers.
    function getLaw(bytes32 lawId) external view returns (ThesisTypes.LawRecord memory) {
        return laws[lawId];
    }

    function getLawByString(string calldata id) external view returns (ThesisTypes.LawRecord memory) {
        return laws[Hashing.lawId(id)];
    }

    function lawsForPillar(bytes32 pillar) external view returns (bytes32[] memory) {
        return _byPillar[pillar];
    }

    function lawsForDomain(bytes32 domain) external view returns (bytes32[] memory) {
        return _byDomain[domain];
    }

    function lawsForPillarString(string calldata pillar) external view returns (bytes32[] memory) {
        return _byPillar[Hashing.lawId(pillar)];
    }

    function lawsForDomainString(string calldata domain) external view returns (bytes32[] memory) {
        return _byDomain[Hashing.lawId(domain)];
    }

    function allLawIds() external view returns (bytes32[] memory) {
        return lawIds;
    }

    /// @notice Seed Monad + system + protocol + intel + execution laws (curator only).
    /// @dev Mirrors runtime `ecosystem_laws.py` ids so dual stack stays aligned.
    function seedDefaultLaws() external onlyCurator {
        // system_self
        _seed("sys.no-real-keys", "safety", "critical", "system_self");
        _seed("sys.sandbox-first", "safety", "critical", "system_self");
        _seed("sys.nomos-veto", "governance", "critical", "system_self");
        _seed("sys.owner-sovereign", "governance", "critical", "system_self");
        _seed("sys.receipt-every-material-act", "governance", "high", "system_self");
        _seed("sys.mandatory-simulation", "execution", "high", "system_self");
        _seed("sys.adapter-honesty", "intelligence", "high", "system_self");
        _seed("sys.kill-switch", "safety", "critical", "system_self");
        // monad_network
        _seed("monad.gas-bills-limit", "execution", "critical", "monad_network");
        _seed("monad.native-transfer-gas", "execution", "high", "monad_network");
        _seed("monad.no-global-mempool", "intelligence", "high", "monad_network");
        _seed("monad.finality", "execution", "high", "monad_network");
        _seed("monad.no-invent-addresses", "safety", "critical", "monad_network");
        _seed("monad.reserve-balance-10-mon", "safety", "high", "monad_network");
        _seed("monad.tx-types", "execution", "high", "monad_network");
        // protocols
        _seed("proto.exact-approval", "safety", "high", "protocols");
        _seed("proto.live-only-when-live", "safety", "critical", "protocols");
        _seed("proto.category-gate", "governance", "high", "protocols");
        // intelligence
        _seed("intel.no-hallucinated-apy", "intelligence", "high", "intelligence");
        _seed("intel.explain-rejects", "intelligence", "medium", "intelligence");
        _seed("intel.teach-on-action", "intelligence", "medium", "intelligence");
        _seed("intel.compete-plans", "intelligence", "medium", "intelligence");
        // execution
        _seed("exec.no-silent-broadcast", "execution", "critical", "execution");
        _seed("exec.ordered-mission", "execution", "high", "execution");
        _seed("exec.re-sim-before-sign", "execution", "high", "execution");
    }

    function _seed(
        string memory id,
        string memory pillar,
        string memory severity,
        string memory domain
    ) internal {
        _write(
            Hashing.lawId(id),
            Hashing.lawId(pillar),
            Hashing.lawId(severity),
            Hashing.lawId(domain)
        );
    }

    function _write(bytes32 lawId, bytes32 pillar, bytes32 severity, bytes32 domain) internal {
        if (laws[lawId].embeddedAt == 0) {
            lawIds.push(lawId);
            unchecked {
                ++lawCount;
            }
            _byPillar[pillar].push(lawId);
            _byDomain[domain].push(lawId);
        }
        laws[lawId] = ThesisTypes.LawRecord({
            lawId: lawId,
            pillar: pillar,
            severity: severity,
            domain: domain,
            active: true,
            embeddedAt: uint64(block.timestamp)
        });
        emit LawEmbedded(lawId, pillar, severity, domain);
    }
}
