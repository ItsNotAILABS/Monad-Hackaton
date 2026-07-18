// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ThesisTypes} from "./ThesisTypes.sol";
import {ThesisErrors} from "./ThesisErrors.sol";
import {Hashing} from "./libraries/Hashing.sol";

/// @title LawBook — onchain mirror of runtime ecosystem laws (metadata registry)
/// @notice Not a substitute for offchain engine embed; provides audit surface.
contract LawBook {
    address public curator;
    uint256 public lawCount;
    mapping(bytes32 => ThesisTypes.LawRecord) public laws;
    bytes32[] public lawIds;
    mapping(bytes32 => bytes32[]) private _byPillar; // pillar => lawIds

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
        if (laws[lawId].embeddedAt == 0) {
            lawIds.push(lawId);
            unchecked {
                ++lawCount;
            }
            _byPillar[Hashing.lawId(pillar)].push(lawId);
        }
        laws[lawId] = ThesisTypes.LawRecord({
            lawId: lawId,
            pillar: Hashing.lawId(pillar),
            severity: Hashing.lawId(severity),
            domain: Hashing.lawId(domain),
            active: true,
            embeddedAt: uint64(block.timestamp)
        });
        emit LawEmbedded(lawId, laws[lawId].pillar, laws[lawId].severity, laws[lawId].domain);
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

    /// @dev Internal-friendly embed without string conversion for seed scripts.
    function embedLawRaw(bytes32 lawId, bytes32 pillar, bytes32 severity, bytes32 domain)
        external
        onlyCurator
    {
        if (laws[lawId].embeddedAt == 0) {
            lawIds.push(lawId);
            unchecked {
                ++lawCount;
            }
            _byPillar[pillar].push(lawId);
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

    function lawsForPillar(bytes32 pillar) external view returns (bytes32[] memory) {
        return _byPillar[pillar];
    }

    function allLawIds() external view returns (bytes32[] memory) {
        return lawIds;
    }

    /// @notice Seed common Monad + system laws (curator only).
    function seedDefaultLaws() external onlyCurator {
        _seed("sys.no-real-keys", "safety", "critical", "system_self");
        _seed("sys.sandbox-first", "safety", "critical", "system_self");
        _seed("sys.nomos-veto", "governance", "critical", "system_self");
        _seed("sys.owner-sovereign", "governance", "critical", "system_self");
        _seed("monad.gas-bills-limit", "execution", "critical", "monad_network");
        _seed("monad.native-transfer-gas", "execution", "high", "monad_network");
        _seed("monad.no-global-mempool", "intelligence", "high", "monad_network");
        _seed("monad.finality", "execution", "high", "monad_network");
        _seed("monad.no-invent-addresses", "safety", "critical", "monad_network");
        _seed("proto.exact-approval", "safety", "high", "protocols");
        _seed("proto.live-only-when-live", "safety", "critical", "protocols");
        _seed("exec.no-silent-broadcast", "execution", "critical", "execution");
        _seed("intel.no-hallucinated-apy", "intelligence", "high", "intelligence");
        _seed("intel.explain-rejects", "intelligence", "medium", "intelligence");
        _seed("intel.teach-on-action", "intelligence", "medium", "intelligence");
    }

    function _seed(
        string memory id,
        string memory pillar,
        string memory severity,
        string memory domain
    ) internal {
        bytes32 lawId = Hashing.lawId(id);
        bytes32 p = Hashing.lawId(pillar);
        if (laws[lawId].embeddedAt == 0) {
            lawIds.push(lawId);
            unchecked {
                ++lawCount;
            }
            _byPillar[p].push(lawId);
        }
        laws[lawId] = ThesisTypes.LawRecord({
            lawId: lawId,
            pillar: p,
            severity: Hashing.lawId(severity),
            domain: Hashing.lawId(domain),
            active: true,
            embeddedAt: uint64(block.timestamp)
        });
        emit LawEmbedded(lawId, p, laws[lawId].severity, laws[lawId].domain);
    }
}
