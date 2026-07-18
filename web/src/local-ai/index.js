/**
 * THESIS browser-local AI surface
 * Transformers.js inference · memory · security · KG · research · docs
 */

import { inferenceStatus } from "./inference.js";
import { memoryStats } from "./memory.js";
import { graphStats } from "./knowledgeGraph.js";
import { securityDashboard } from "./security.js";
import { listAgents } from "./research.js";

export {
  ensureEmbedder,
  embed,
  embedSafe,
  embedFallback,
  inferenceStatus,
} from "./inference.js";

export {
  remember,
  listNotes,
  listEvents,
  listDocs,
  listRuns,
  memoryStats,
  recall,
  logEvent,
  cosine,
} from "./memory.js";

export {
  getGraph,
  upsertNode,
  addEdge,
  neighbors,
  searchNodes,
  graphStats,
  hydrateFromPlatform,
  ingestText,
  exportGraph,
  clearGraph,
} from "./knowledgeGraph.js";

export {
  scanText,
  assertSafe,
  monitorPayload,
  auditMemory,
  securityDashboard,
} from "./security.js";

export { runResearch, listAgents, rankTexts } from "./research.js";

export {
  generateResearchReport,
  generateSecurityBrief,
  generateKnowledgeMap,
  generatePlatformOpsDoc,
  downloadMarkdown,
} from "./documents.js";

export async function localAiManifest() {
  let mem = { notes: 0, events: 0, docs: 0, runs: 0 };
  let sec = { posture: "unknown", alerts: 0 };
  try {
    mem = await memoryStats();
  } catch {
    /* idb may be blocked */
  }
  try {
    sec = await securityDashboard();
  } catch {
    /* ignore */
  }
  return {
    schema: "thesis.local_ai.v1",
    product: "THESIS Local AI",
    locality: "browser-only",
    engines: {
      inference: inferenceStatus(),
      memory: mem,
      knowledge_graph: graphStats(),
      security: sec,
      agents: listAgents(),
      documents: { formats: ["markdown"], store: "IndexedDB" },
    },
    doctrine: [
      "All inference runs in the browser (Transformers.js)",
      "Memory never leaves the device",
      "Security monitor blocks key/seed paste",
      "Research agents use local embeddings + graph + platform pulse",
      "Documents generate offline as markdown",
    ],
  };
}
