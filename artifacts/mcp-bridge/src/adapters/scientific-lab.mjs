export const scientificLabTools = [
  {
    name: "scientific_lab.status",
    title: "Scientific Experiment Lab Status",
    description: "Returns the local Scientific Experiment Lab integration posture without claiming an external deployment.",
    risk: "read",
    inputSchema: { type: "object", additionalProperties: false },
    handler: async () => ({
      status: "integration-ready",
      execution: "governed-local",
      validation: "source-defined",
      externalDeploymentClaimed: false,
    }),
  },
  {
    name: "scientific_lab.experiment.propose",
    title: "Propose Scientific Experiment",
    description: "Creates a bounded experiment proposal for later owner review; it does not execute the experiment.",
    risk: "propose",
    inputSchema: {
      type: "object",
      required: ["title", "hypothesis"],
      properties: {
        title: { type: "string" },
        hypothesis: { type: "string" },
        variables: { type: "array", items: { type: "string" } },
      },
      additionalProperties: true,
    },
    handler: async (input) => ({
      state: "proposed",
      title: String(input.title || "Untitled experiment").slice(0, 200),
      hypothesis: String(input.hypothesis || "").slice(0, 4000),
      variables: Array.isArray(input.variables) ? input.variables.map(String).slice(0, 32) : [],
      executed: false,
      nextAuthority: "owner-approval",
    }),
  },
];
