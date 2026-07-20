// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IAgentServiceMarketView {
    enum JobStatus { None, Funded, Accepted, Submitted, Disputed, Completed, Refunded }

    struct Service {
        address provider;
        string name;
        string metadataURI;
        bytes32 capability;
        uint96 price;
        uint32 slaSeconds;
        bool active;
    }