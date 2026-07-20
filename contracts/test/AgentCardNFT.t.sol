// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AgentCardNFT, IAgentCardReceiver} from "../src/AgentCardNFT.sol";

contract AgentCardWallet is IAgentCardReceiver {
    function mint(
        AgentCardNFT cards,
        bytes32 profileHash,
        bytes32 capabilityHash,
        bytes32 doctrineHash,
        bytes32 runtimeHash,
        uint32 version,
        string calldata metadataURI
    ) external returns (uint256) {
        return cards.mintAgentCard(
            profileHash,
            capabilityHash,
            doctrineHash,
            runtimeHash,
            version,
            metadataURI
        );
    }

    function transferAttempt(AgentCardNFT cards, address recipient, uint256 tokenId)
        external
        returns (bool)
    {
        try cards.transferFrom(address(this), recipient, tokenId) {
            return true;
        } catch {
            return false;
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IAgentCardReceiver.onERC721Received.selector;
    }
}

contract AgentCardNFTTest {
    AgentCardNFT private cards;
    AgentCardWallet private agent;

    function setUp() public {
        cards = new AgentCardNFT("THESIS Agent Cards", "AGENT");
        agent = new AgentCardWallet();
    }

    function testAgentSelfMintsLockedCard() public {
        uint256 tokenId = agent.mint(
            cards,
            keccak256("profile"),
            keccak256("capabilities"),
            keccak256("doctrine"),
            keccak256("runtime"),
            1,
            "ipfs://agent-card"
        );
        require(tokenId == 1, "token id");
        require(cards.ownerOf(tokenId) == address(agent), "owner");
        require(cards.locked(tokenId), "locked");
        require(cards.balanceOf(address(agent)) == 1, "balance");
        require(bytes(cards.tokenURI(tokenId)).length > 0, "uri");
        AgentCardNFT.AgentCard memory card = cards.getAgentCard(tokenId);
        require(card.agent == address(agent), "agent");
        require(card.version == 1, "version");
        require(card.profileHash == keccak256("profile"), "profile");
        require(card.capabilityHash == keccak256("capabilities"), "capabilities");
        require(card.doctrineHash == keccak256("doctrine"), "doctrine");
        require(card.runtimeHash == keccak256("runtime"), "runtime");
    }

    function testDuplicateCardRejected() public {
        agent.mint(
            cards,
            keccak256("profile"),
            keccak256("capabilities"),
            keccak256("doctrine"),
            keccak256("runtime"),
            1,
            "ipfs://agent-card"
        );
        try agent.mint(
            cards,
            keccak256("profile"),
            keccak256("capabilities"),
            keccak256("doctrine"),
            keccak256("runtime"),
            1,
            "ipfs://agent-card"
        ) {
            revert("duplicate should fail");
        } catch {}
    }

    function testNewVersionCanBeMinted() public {
        uint256 first = agent.mint(
            cards,
            keccak256("profile"),
            keccak256("capabilities"),
            keccak256("doctrine"),
            keccak256("runtime"),
            1,
            "ipfs://agent-card-v1"
        );
        uint256 second = agent.mint(
            cards,
            keccak256("profile-v2"),
            keccak256("capabilities-v2"),
            keccak256("doctrine"),
            keccak256("runtime-v2"),
            2,
            "ipfs://agent-card-v2"
        );
        require(first == 1 && second == 2, "versions");
        require(cards.balanceOf(address(agent)) == 2, "version history");
    }

    function testCardsCannotTransfer() public {
        uint256 tokenId = agent.mint(
            cards,
            keccak256("profile"),
            keccak256("capabilities"),
            keccak256("doctrine"),
            keccak256("runtime"),
            1,
            "ipfs://agent-card"
        );
        require(!agent.transferAttempt(cards, address(0xBEEF), tokenId), "transfer blocked");
        require(cards.ownerOf(tokenId) == address(agent), "owner unchanged");
    }

    function testRejectsIncompleteManifest() public {
        try agent.mint(
            cards,
            bytes32(0),
            keccak256("capabilities"),
            keccak256("doctrine"),
            keccak256("runtime"),
            1,
            "ipfs://agent-card"
        ) {
            revert("invalid should fail");
        } catch {}
    }
}
