// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AgentCredentialNFT, IAgentServiceMarketView, IERC721Receiver} from "../src/AgentCredentialNFT.sol";

contract MockAgentMarket {
    mapping(uint256 => IAgentServiceMarketView.Job) private _jobs;

    function setJob(
        uint256 jobId,
        address client,
        address provider,
        IAgentServiceMarketView.JobStatus status,
        bytes32 requestHash,
        bytes32 resultHash,
        bytes32 receiptHash
    ) external {
        _jobs[jobId] = IAgentServiceMarketView.Job({
            serviceId: 7,
            client: client,
            provider: provider,
            payment: 1 ether,
            createdAt: uint64(block.timestamp),
            acceptedAt: uint64(block.timestamp),
            executionDeadline: uint64(block.timestamp + 1 hours),
            reviewDeadline: uint64(block.timestamp + 2 hours),
            status: status,
            requestHash: requestHash,
            resultHash: resultHash,
            receiptHash: receiptHash
        });
    }

    function getJob(uint256 jobId) external view returns (IAgentServiceMarketView.Job memory) {
        return _jobs[jobId];
    }
}

contract CredentialActor is IERC721Receiver {
    function mintProof(AgentCredentialNFT nft, uint256 jobId, string calldata uri) external returns (uint256) {
        return nft.mintJobProof(jobId, uri);
    }

    function tryTransfer(AgentCredentialNFT nft, address to, uint256 tokenId) external returns (bool) {
        try nft.transferFrom(address(this), to, tokenId) {
            return true;
        } catch {
            return false;
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract AgentCredentialNFTTest {
    MockAgentMarket private market;
    AgentCredentialNFT private nft;
    CredentialActor private client;
    CredentialActor private provider;
    CredentialActor private outsider;

    function setUp() public {
        market = new MockAgentMarket();
        nft = new AgentCredentialNFT(address(market), address(this), "THESIS Agent Credentials", "TAC");
        client = new CredentialActor();
        provider = new CredentialActor();
        outsider = new CredentialActor();
    }

    function testGovernorMintsLockedAgentIdentity() public {
        uint256 tokenId = nft.mintAgentCredential(
            address(provider), keccak256("provider-identity"), keccak256("analysis-capability"), "ipfs://agent"
        );
        require(tokenId == 1, "token id");
        require(nft.ownerOf(tokenId) == address(provider), "owner");
        require(nft.locked(tokenId), "locked");
        AgentCredentialNFT.Credential memory credential = nft.getCredential(tokenId);
        require(uint8(credential.kind) == uint8(AgentCredentialNFT.CredentialKind.AgentIdentity), "kind");
        require(credential.subject == address(provider), "subject");
        require(!provider.tryTransfer(nft, address(client), tokenId), "must not transfer");
    }

    function testClientAndProviderMintProofAfterCompletion() public {
        market.setJob(
            11,
            address(client),
            address(provider),
            IAgentServiceMarketView.JobStatus.Completed,
            keccak256("request"),
            keccak256("result"),
            keccak256("receipt")
        );
        uint256 clientToken = client.mintProof(nft, 11, "ipfs://proof/client");
        uint256 providerToken = provider.mintProof(nft, 11, "ipfs://proof/provider");
        require(clientToken == 1 && providerToken == 2, "mint order");
        require(nft.ownerOf(clientToken) == address(client), "client owner");
        require(nft.ownerOf(providerToken) == address(provider), "provider owner");
        require(nft.getCredential(clientToken).referenceId == 11, "job reference");
    }

    function testRejectsIncompleteUnauthorizedAndDuplicateProofs() public {
        market.setJob(
            12,
            address(client),
            address(provider),
            IAgentServiceMarketView.JobStatus.Submitted,
            keccak256("request"),
            keccak256("result"),
            keccak256("receipt")
        );
        try client.mintProof(nft, 12, "ipfs://early") {
            revert("incomplete job should fail");
        } catch {}

        market.setJob(
            12,
            address(client),
            address(provider),
            IAgentServiceMarketView.JobStatus.Completed,
            keccak256("request"),
            keccak256("result"),
            keccak256("receipt")
        );
        try outsider.mintProof(nft, 12, "ipfs://outsider") {
            revert("outsider should fail");
        } catch {}

        client.mintProof(nft, 12, "ipfs://proof");
        try client.mintProof(nft, 12, "ipfs://duplicate") {
            revert("duplicate should fail");
        } catch {}
    }
}
