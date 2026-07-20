import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  ".github/workflows/deploy-thesis-web.yml",
  "web/src/AgentPanel.jsx",
  "web/src/AutonomousEconomy.jsx",
  "web/src/chain/agentEconomy.js",
  "web/functions/runtime-config.js",
  "web/functions/rpc.js",
  "contracts/foundry.toml",
];
const forbidden = [
  /monados\.medinatechlabs\.net/i,
  /testnet-rpc\.monad\.xyz/i,
  /rpc\.monad\.xyz/i,
  /thesis-operations/i,
  /monadbuilder-plus/i,
  /["'`]0x[0-9a-fA-F]{40}["'`]/,
  /const\s+SERVICES\s*=/,
  /const\s+ACTORS\s*=/,
];
const failures = [];
for (const relative of files) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) { failures.push(`${relative}: missing`); continue; }
  const source = fs.readFileSync(absolute, "utf8");
  for (const pattern of forbidden) if (pattern.test(source)) failures.push(`${relative}: ${pattern}`);
}
if (failures.length) {
  console.error("Embedded production configuration detected:\n" + failures.join("\n"));
  process.exit(1);
}
console.log(`runtime hardcode gate passed for ${files.length} deployment files`);
