// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IAgentServiceMarketView {
    enum JobStatus { None, Funded, Accepted, Submitted, Disputed, Completed, Refunded }

    struct Job {
        uint256 serviceId;
        address client;
        address provider;
        uint96 payment;
        uint64 createdAt;
        uint64 acceptedAt;
        uint64 executionDeadline;
        uint64 reviewDeadline;
        JobStatus status;
        bytes32 requestHash;
        bytes32 resultHash;
        bytes32 receiptHash;
    }

    function getJob(uint256 jobId) external view returns (Job memory);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4);
}

/// @title AgentCredentialNFT
/// @notice Locked ERC-721 credentials for agent identities and completed service jobs.
/// @dev Implements ERC-165, ERC-721 metadata, and ERC-5192. Tokens cannot be transferred.
contract AgentCredentialNFT {
    enum CredentialKind { AgentIdentity, JobProof }

    struct Credential {
        CredentialKind kind;
        address subject;
        uint256 referenceId;
        bytes32 contentHash;
        string metadataURI;
        uint64 mintedAt;
    }

    error ZeroAddress();
    error Unauthorized();
    error NotFound();
    error LockedToken();
    error InvalidCredential();
    error AlreadyMinted();
    error UnsafeRecipient();

    string public name;
    string public symbol;
    address public governor;
    IAgentServiceMarketView public immutable market;
    uint256 public totalSupply;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => Credential) private _credentials;
    mapping(address => uint256[]) private _ownedTokenIds;
    mapping(bytes32 => uint256) public credentialToken;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Locked(uint256 indexed tokenId);
    event GovernanceTransferred(address indexed previousGovernor, address indexed nextGovernor);
    event CredentialMinted(
        uint256 indexed tokenId,
        CredentialKind indexed kind,
        address indexed subject,
        uint256 referenceId,
        bytes32 contentHash,
        string metadataURI
    );

    modifier onlyGovernor() {
        if (msg.sender != governor) revert Unauthorized();
        _;
    }

    constructor(address marketAddress, address initialGovernor, string memory collectionName, string memory collectionSymbol) {
        if (marketAddress == address(0) || initialGovernor == address(0)) revert ZeroAddress();
        if (bytes(collectionName).length == 0 || bytes(collectionSymbol).length == 0) revert InvalidCredential();
        market = IAgentServiceMarketView(marketAddress);
        governor = initialGovernor;
        name = collectionName;
        symbol = collectionSymbol;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f
            || interfaceId == 0xb45a3c0e;
    }

    function transferGovernance(address nextGovernor) external onlyGovernor {
        if (nextGovernor == address(0)) revert ZeroAddress();
        address previous = governor;
        governor = nextGovernor;
        emit GovernanceTransferred(previous, nextGovernor);
    }

    function mintAgentCredential(
        address subject,
        bytes32 identityHash,
        bytes32 capabilityHash,
        string calldata metadataURI
    ) external onlyGovernor returns (uint256 tokenId) {
        if (subject == address(0) || identityHash == bytes32(0) || capabilityHash == bytes32(0)) {
            revert InvalidCredential();
        }
        bytes32 key = keccak256(abi.encode(CredentialKind.AgentIdentity, subject, identityHash, capabilityHash));
        tokenId = _mintCredential(
            subject,
            CredentialKind.AgentIdentity,
            uint256(identityHash),
            capabilityHash,
            metadataURI,
            key
        );
    }

    function mintJobProof(uint256 jobId, string calldata metadataURI) external returns (uint256 tokenId) {
        IAgentServiceMarketView.Job memory job = market.getJob(jobId);
        if (job.status != IAgentServiceMarketView.JobStatus.Completed) revert InvalidCredential();
        if (msg.sender != job.client && msg.sender != job.provider) revert Unauthorized();
        bytes32 key = keccak256(abi.encode(CredentialKind.JobProof, jobId, msg.sender));
        bytes32 contentHash = keccak256(
            abi.encode(job.serviceId, job.client, job.provider, job.payment, job.requestHash, job.resultHash, job.receiptHash)
        );
        tokenId = _mintCredential(msg.sender, CredentialKind.JobProof, jobId, contentHash, metadataURI, key);
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
        return _credentials[tokenId].metadataURI;
    }

    function locked(uint256 tokenId) external view returns (bool) {
        ownerOf(tokenId);
        return true;
    }

    function getCredential(uint256 tokenId) external view returns (Credential memory) {
        ownerOf(tokenId);
        return _credentials[tokenId];
    }

    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _ownedTokenIds[owner];
    }

    function approve(address, uint256) external pure { revert LockedToken(); }
    function setApprovalForAll(address, bool) external pure { revert LockedToken(); }
    function getApproved(uint256 tokenId) external view returns (address) { ownerOf(tokenId); return address(0); }
    function isApprovedForAll(address, address) external pure returns (bool) { return false; }
    function transferFrom(address, address, uint256) external pure { revert LockedToken(); }
    function safeTransferFrom(address, address, uint256) external pure { revert LockedToken(); }
    function safeTransferFrom(address, address, uint256, bytes calldata) external pure { revert LockedToken(); }

    function _mintCredential(
        address subject,
        CredentialKind kind,
        uint256 referenceId,
        bytes32 contentHash,
        string calldata metadataURI,
        bytes32 key
    ) internal returns (uint256 tokenId) {
        if (subject == address(0) || contentHash == bytes32(0) || bytes(metadataURI).length == 0) {
            revert InvalidCredential();
        }
        if (credentialToken[key] != 0) revert AlreadyMinted();
        tokenId = ++totalSupply;
        credentialToken[key] = tokenId;
        _owners[tokenId] = subject;
        _balances[subject] += 1;
        _ownedTokenIds[subject].push(tokenId);
        _credentials[tokenId] = Credential(kind, subject, referenceId, contentHash, metadataURI, uint64(block.timestamp));
        emit Transfer(address(0), subject, tokenId);
        emit Locked(tokenId);
        emit CredentialMinted(tokenId, kind, subject, referenceId, contentHash, metadataURI);
        if (subject.code.length != 0) {
            try IERC721Receiver(subject).onERC721Received(msg.sender, address(0), tokenId, "") returns (bytes4 value) {
                if (value != IERC721Receiver.onERC721Received.selector) revert UnsafeRecipient();
            } catch {
                revert UnsafeRecipient();
            }
        }
    }
}
