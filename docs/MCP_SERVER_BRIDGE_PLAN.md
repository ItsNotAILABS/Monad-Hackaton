# MCP Server Bridge Product Plan

## Decision

The MCP Server Bridge is a core integration layer for the ItsNotAILABS and LoomMultiAI platform. It connects standards-compatible MCP clients and servers to the Scientific Experiment Lab, MonadBuilder+, THESIS, Medina Agent Forge desktop, NOVA mobile, MESIE, NEXUS, Loom Cluster, and the broader tool ecosystem.

The dashboard indicator `mcp://localhost:8080` represents the local-first bridge endpoint. The indicator shows connection state only; successful actions require separate execution and receipt evidence.

## Platform purpose

The bridge converts visual and analytical workflows into governed, observable workflows:

```text
concept or mission
  -> schematic/application/experiment
  -> MESIE analysis
  -> approved capability discovery
  -> plan preview
  -> governed action
