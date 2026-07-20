// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IAgentCardReceiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4);
}

/// @title AgentCardNFT
/// @notice Self-minted, permanently locked identity cards for autonomous agents.
/// @dev ERC-721 metadata + ERC-5192. Cards are attestations, not transferable assets.
contract AgentCardNFT {
    struct AgentCard {
        address agent;
        bytes32 profileHash;
        bytes32 capabilityHash;
        bytes32 doctrineHash;
        bytes32 runtimeHash;
        string metadataURI;
        uint64 mintedAt;
        uint32 version;
    }

    error ZeroAddress();
    error InvalidCard();
    error AlreadyMinted();
    error NotFound();
    error LockedToken();
    error UnsafeRecipient();

    string public name;
    string public symbol;
    uint256 public totalSupply;
    string public constant SCHEMA_VERSION = "thesis.agent-card.v1";

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => AgentCard) private _cards;
    mapping(address => uint256[]) private _ownedTokenIds;
    mapping(bytes32 => uint256) public cardToken;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Locked(uint256 indexed tokenId);
    event AgentCardMinted(
        uint256 indexed tokenId,
        address indexed agent,
        bytes32 indexed profileHash,
        bytes32 capabilityHash,
        bytes32 doctrineHash,
        bytes32 runtimeHash,
        uint32 version,
        string metadataURI
    );

    constructor(string memory collectionName, string memory collectionSymbol) {
        if (bytes(collectionName).length == 0 || bytes(collectionSymbol).length == 0) {
            revert InvalidCard();
        }
        name = collectionName;
        symbol = collectionSymbol;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f
            || interfaceId == 0xb45a3c0e;
    }

    function mintAgentCard(
        bytes32 profileHash,
        bytes32 capabilityHash,
        bytes32 doctrineHash,
        bytes32 runtimeHash,
        uint32 version,
        string calldata metadataURI
    ) external returns (uint256 tokenId) {
        if (
            profileHash == bytes32(0) || capabilityHash == bytes32(0)
                || doctrineHash == bytes32(0) || runtimeHash == bytes32(0)
                || version == 0 || bytes(metadataURI).length == 0
        ) revert InvalidCard();

        bytes32 key = keccak256(
            abi.encode(msg.sender, profileHash, capabilityHash, doctrineHash, runtimeHash, version)
        );
        if (cardToken[key] != 0) revert AlreadyMinted();

        tokenId = ++totalSupply;
        cardToken[key] = tokenId;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;
        _ownedTokenIds[msg.sender].push(tokenId);
        _cards[tokenId] = AgentCard({
            agent: msg.sender,
            profileHash: profileHash,
            capabilityHash: capabilityHash,
            doctrineHash: doctrineHash,
            runtimeHash: runtimeHash,
            metadataURI: metadataURI,
            mintedAt: uint64(block.timestamp),
            version: version
        });

        emit Transfer(address(0), msg.sender, tokenId);
        emit Locked(tokenId);
        emit AgentCardMinted(
            tokenId,
            msg.sender,
            profileHash,
            capabilityHash,
            doctrineHash,
            runtimeHash,
            version,
            metadataURI
        );

        if (msg.sender.code.length != 0) {
            try IAgentCardReceiver(msg.sender).onERC721Received(msg.sender, address(0), tokenId, "")
                returns (bytes4 value)
            {
                if (value != IAgentCardReceiver.onERC721Received.selector) revert UnsafeRecipient();
            } catch {
                revert UnsafeRecipient();
            }
        }
    }

    function ownerOf(uint256 tokenId) public view returns (address owner) {
        owner = _owners[tokenId];
        if (owner == address(0)) revert NotFound();
    }

    function balanceOf(address owner) external view returns (uint256) {
        if (owner == address(0)) revert ZeroAddress();
        return _balances[owner];
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        ownerOf(tokenId);
        return _cards[tokenId].metadataURI;
    }

    function locked(uint256 tokenId) external view returns (bool) {
        ownerOf(tokenId);
        return true;
    }

    function getAgentCard(uint256 tokenId) external view returns (AgentCard memory) {
        ownerOf(tokenId);
        return _cards[tokenId];
    }

    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _ownedTokenIds[owner];
    }

    function approve(address, uint256) external pure { revert LockedToken(); }
    function setApprovalForAll(address, bool) external pure { revert LockedToken(); }
    function getApproved(uint256 tokenId) external view returns (address) {
        ownerOf(tokenId);
        return address(0);
    }
    function isApprovedForAll(address, address) external pure returns (bool) { return false; }
    function transferFrom(address, address, uint256) external pure { revert LockedToken(); }
    function safeTransferFrom(address, address, uint256) external pure { revert LockedToken(); }
    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert LockedToken();
    }
}
