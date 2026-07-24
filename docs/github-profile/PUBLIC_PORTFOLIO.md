# ItsNotAI Labs Public Portfolio

This document defines how the GitHub organization should be presented to researchers, developers, partners, investors, enterprise buyers, and technical reviewers.

## Public front door

The organization profile should make five things immediately clear:

1. **What the lab builds:** sovereign intelligence infrastructure, persistent AI systems, scientific computing, governed execution, and verifiable digital economies.
2. **What the flagship product is:** MonadBuilder+ and THESIS Agent Desktop.
3. **How authority works:** agents propose; policy evaluates; owners approve; wallets sign; receipts remember.
4. **What is implemented versus experimental:** every repository should state its maturity and proof boundary.
5. **Where to begin:** visitors should have one obvious route into the flagship platform, one into research, one into scientific AI, and one into financial infrastructure.

## Recommended pinned repositories

Pin these six repositories in this order:

1. **CapsulaBuilder** — flagship product and most complete public platform story.
2. **MedinaMemorySystems** — foundational memory and sovereign-intelligence architecture.
3. **Enterprise-OS-intelligence** — research doctrine, protocols, governance intelligence, and long-form architecture.
4. **Multi-Element-Spectral-Intelligence-Engine-MESIE-** — scientific AI and externally legible research stack.
5. **PARRALAX-AIHFTFUND** — AI-native finance and market infrastructure.
6. **CAPSULA** or **PARALLAX-Exchange-Clearinghouse** — deployment platform or clearing architecture, depending on the audience being prioritized.

Because MESIE currently lives under `FreddyCreates`, pinning it on the personal profile is especially important. A future transfer into the organization can be considered after package, DOI, release, and link continuity are reviewed.

## Repository categories

### Flagship product

- `CapsulaBuilder`

### Core intelligence infrastructure

- `MedinaMemorySystems`
- `Enterprise-OS-intelligence`
- `AURO`
- `Auro14B`
- `NEUROSWARMAI`

### Financial infrastructure

- `PARRALAX-AIHFTFUND`
- `PARALLAX-Exchange-Clearinghouse`
- `OnChain`

### Deployment and developer infrastructure

- `CAPSULA`
- `specforge-launch-studio`
- `mercatus-launch-studio`
- `nexus`
- `x-mcp-skills`
- `organism-bots-mcp-server`
- `nova-connector-control-plane`

### Security and defensive systems

- `CyberSecurity-AI`

### Research and experimental systems

- `FABLEBREAKER`
- `MatDaemon`
- other active research repositories with a clear README and maturity label

## Repositories that weaken the public profile

The organization currently exposes several names that read like temporary output, backups, stale automation products, or incomplete experiments. They should not be deleted without review, but they should be evaluated for archival or private visibility.

Priority review set:

- `PRODUCTION-`
- all repositories containing `.stale.` in the name
- empty or near-empty generated career repositories
- experimental repositories without a README, license, maturity declaration, or runnable path
- duplicated launch studios and narrow MCP experiments that are already incorporated into the flagship architecture

Recommended decision labels:

| Label | Meaning |
|---|---|
| **FLAGSHIP** | Public, actively maintained, prominent, and pinned. |
| **ACTIVE RESEARCH** | Public research with clear boundaries and active development. |
| **PUBLIC ARCHIVE** | Prior art or historical snapshot; archived and clearly labeled. |
| **INCUBATION** | Private until the product story and proof package are ready. |
| **INTERNAL** | Private operational, security-sensitive, or unreleased infrastructure. |
| **SUPERSEDED** | Archived with a link to the canonical successor. |

## Standard repository header

Every serious public repository should open with:

- product or program name;
- one-sentence purpose;
- maturity badge: Research, Prototype, Alpha, Beta, Production Candidate, or Released;
- validation badge tied to a real workflow where possible;
- supported runtime or deployment modes;
- explicit authority and security boundary;
- quick-start command;
- architecture diagram or repository map;
- implemented capabilities;
- known limitations;
- roadmap separated from shipped facts;
- license and citation information where applicable.

## Standard maturity language

Use these terms consistently:

### Research

Architecture, experiments, papers, or source investigations. May not be packaged for general users.

### Prototype

Runnable in a constrained environment, but APIs, schemas, and operations may change.

### Alpha

Integrated primary flows with known limitations. Requires operator awareness and is not independently audited.

### Beta

Broader validation, release automation, upgrade discipline, monitoring, and operational documentation are present.

### Production candidate

Release artifacts and gates are complete, but final external deployment, signing, notarization, security review, or operational acceptance may still be pending.

### Released

A versioned release exists with artifacts, documentation, proof records, supported deployment paths, and declared support boundaries.

Never use “production-grade,” “live,” “autonomous,” “institutional,” “sub-millisecond,” or similar claims without repository evidence supporting the exact statement.

## Organization profile metadata

Recommended GitHub organization settings:

- **Display name:** ItsNotAI Labs
- **Description:** Sovereign intelligence infrastructure, persistent AI systems, governed execution, scientific computing, and verifiable digital economies.
- **Website:** use the canonical lab or flagship product domain after DNS and ownership are confirmed.
- **Location:** Dallas–Fort Worth, Texas
- **Public email:** a dedicated lab-facing address rather than a personal inbox
- **Twitter/X:** `@itsnotailabs` when confirmed as canonical

## Personal profile metadata

Recommended personal GitHub settings:

- **Name:** Alfredo Medina Hernandez
- **Bio:** Founder and systems architect building persistent synthetic cognition, governed AI execution, scientific intelligence, and sovereign digital infrastructure.
- **Company:** @ItsNotAILABS / MedinaSITech
- **Location:** Dallas–Fort Worth, Texas
- **Website:** canonical founder or lab page
- **Social account:** canonical ItsNotAI Labs account

## Required profile repositories

GitHub renders organization and personal profile READMEs from special repositories:

### Organization

```text
ItsNotAILABS/.github
└── profile/
    └── README.md
```

Copy `ORGANIZATION_PROFILE_README.md` to `.github/profile/README.md`.

### Personal

```text
FreddyCreates/FreddyCreates
└── README.md
```

Copy `FOUNDER_PROFILE_README.md` to that repository’s root `README.md`.

## Next public-trust upgrades

After the profile is activated:

1. Merge and validate the two-product consolidation PR.
2. Add real screenshots and a short architecture animation to the organization profile.
3. Establish a shared `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and support policy.
4. Add maturity and proof metadata to the top six repositories.
5. Archive stale public repositories after a deliberate preservation review.
6. Publish a public research index linking papers, DOI records, protocols, and reproducible artifacts.
7. Add release signing and provenance for desktop, Python, npm, container, and canister artifacts.
8. Create a public proofroom containing release manifests, benchmark receipts, hash chains, and audit boundaries.
