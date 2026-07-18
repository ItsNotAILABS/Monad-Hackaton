// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
contract ProposalBook {
    enum Status { Proposed, Simulated, Approved, Rejected, Executed, Failed }
    struct Proposal { address owner; address agent; bytes32 actionHash; bytes32 simulationHash; Status status; uint64 createdAt; }
    uint256 public nextId = 1;
    mapping(uint256 => Proposal) public proposals;
    event Proposed(uint256 indexed id, address indexed owner, address indexed agent, bytes32 actionHash);
    event StatusChanged(uint256 indexed id, Status status, bytes32 simulationHash);
    function propose(bytes32 actionHash) external returns(uint256 id){ id=nextId++; proposals[id]=Proposal(msg.sender,msg.sender,actionHash,bytes32(0),Status.Proposed,uint64(block.timestamp)); emit Proposed(id,msg.sender,msg.sender,actionHash); }
    function setStatus(uint256 id, Status status, bytes32 simulationHash) external { Proposal storage p=proposals[id]; require(msg.sender==p.owner || msg.sender==p.agent,"auth"); p.status=status; p.simulationHash=simulationHash; emit StatusChanged(id,status,simulationHash); }
}
