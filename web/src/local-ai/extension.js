/**
 * Packaged browser extension download (Chrome/Edge load-unpacked ZIP).
 * Security scanner companion — no wallet key permissions.
 */

import JSZip from "jszip";
import { logEvent } from "./memory.js";

const MANIFEST = {
  manifest_version: 3,
  name: "THESIS Security Seatbelt",
  version: "1.0.0",
  description:
    "Browser-local security scan for secrets and DeFi risk language. Companion to THESIS Platform. No key access.",
  action: {
    default_popup: "popup.html",
    default_title: "THESIS Security",
  },
  permissions: ["activeTab", "storage"],
  host_permissions: [],
  icons: {},
};

const POPUP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>THESIS Security</title>
  <link rel="stylesheet" href="popup.css" />
</head>
<body>
  <header>
    <b>THESIS</b> · Security Seatbelt
  </header>
  <p class="muted">Scan selected page text or clipboard-like paste for keys, seeds, and DeFi risk patterns. Local only.</p>
  <textarea id="input" rows="6" placeholder="Paste text to scan (never real seeds)…"></textarea>
  <div class="row">
    <button id="scan" type="button">Scan</button>
    <button id="clear" type="button" class="ghost">Clear</button>
  </div>
  <pre id="out" class="out">Ready.</pre>
  <footer>
    <a id="open" href="#" target="_blank" rel="noreferrer">Open THESIS Platform</a>
    <span class="muted"> · permissions: activeTab + storage only</span>
  </footer>
  <script src="popup.js"></script>
</body>
</html>
`;

const POPUP_CSS = `body {
  font-family: ui-sans-serif, system-ui, sans-serif;
  width: 320px;
  margin: 0;
  padding: 12px;
  background: #0a0b12;
  color: #e8e6f0;
}
header { font-size: 13px; margin-bottom: 8px; letter-spacing: 0.04em; }
.muted { color: #9b97b0; font-size: 11px; }
textarea {
  width: 100%;
  box-sizing: border-box;
  margin: 8px 0;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #2a2b3a;
  background: #05060c;
  color: inherit;
  font-size: 12px;
}
.row { display: flex; gap: 8px; }
button {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 0;
  background: linear-gradient(135deg, #8b6cff, #2ee6a6);
  color: #0a0b12;
  font-weight: 700;
  cursor: pointer;
}
button.ghost {
  background: transparent;
  border: 1px solid #2a2b3a;
  color: #e8e6f0;
  font-weight: 500;
}
.out {
  margin-top: 10px;
  padding: 8px;
  background: #12131c;
  border-radius: 8px;
  font-size: 11px;
  white-space: pre-wrap;
  max-height: 180px;
  overflow: auto;
}
footer { margin-top: 10px; font-size: 11px; }
a { color: #a794ff; }
`;

const POPUP_JS = `const SECRET = [
  { id: "privkey", re: /\\b(?:0x)?[a-fA-F0-9]{64}\\b/g, severity: "critical", label: "Possible private key" },
  { id: "mnemonic", re: /\\b([a-z]+\\s+){11,23}[a-z]+\\b/gi, severity: "critical", label: "Possible seed phrase" },
  { id: "api", re: /\\b(?:sk|api[_-]?key|secret)[-_:= ]+[A-Za-z0-9/+=]{16,}/gi, severity: "high", label: "API key-like" },
];
const RISK = [
  { id: "unlimited", re: /unlimited\\s+approv|maxUint256/gi, severity: "high", label: "Unlimited approval" },
  { id: "silent", re: /auto[- ]?broadcast|without\\s+signature/gi, severity: "critical", label: "Silent broadcast" },
  { id: "export", re: /export\\s+(private\\s+)?key|show\\s+mnemonic/gi, severity: "critical", label: "Key export" },
  { id: "gas", re: /2x\\s+buffer|gas\\s*limit\\s*[:=]?\\s*\\d{7,}/gi, severity: "medium", label: "Fat gas limit" },
];

function scan(text) {
  const findings = [];
  for (const p of [...SECRET, ...RISK]) {
    p.re.lastIndex = 0;
    const m = String(text || "").match(p.re);
    if (m) findings.push({ ...p, count: m.length, re: undefined });
  }
  return findings;
}

const out = document.getElementById("out");
const input = document.getElementById("input");
document.getElementById("scan").onclick = () => {
  const f = scan(input.value);
  if (!f.length) {
    out.textContent = "CLEAN · no secret/risk patterns.\\nStill: never paste real seeds.";
    return;
  }
  out.textContent = f.map((x) => "[" + x.severity + "] " + x.label + " ×" + x.count).join("\\n");
};
document.getElementById("clear").onclick = () => {
  input.value = "";
  out.textContent = "Ready.";
};
document.getElementById("open").href = "http://127.0.0.1:5173/";

// Teach tip on open
chrome.storage?.local?.get(["taught"], (r) => {
  if (!r?.taught) {
    out.textContent = "TEACH: Paste public text only. Critical findings mean stop.\\nInstall: chrome://extensions → Load unpacked.";
    chrome.storage?.local?.set({ taught: true });
  }
});
`;

const README = `# THESIS Security Seatbelt (extension)

## Install (Chrome / Edge / Brave)

1. Unzip this package.
2. Open \`chrome://extensions\` (or \`edge://extensions\`).
3. Enable **Developer mode**.
4. **Load unpacked** → select this folder.
5. Pin the extension. Open popup → paste text → Scan.

## Permissions

- \`activeTab\` — optional page interaction later; popup works standalone
- \`storage\` — remembers "taught" tip only

**No** \`<all_urls>\`, **no** clipboard read, **no** wallet permissions.

## Security

- Never paste real private keys or seed phrases.
- Scanner is pattern-based local JS — not a cloud service.
- Companion to THESIS Platform LOCAL AI tab.

## Teach

1. Scan clean research notes → expect CLEAN.
2. Scan text containing "unlimited approve" → expect HIGH.
3. Scan 12+ word fake seed → expect CRITICAL (still do not use real seeds).
`;

/**
 * Build and download ZIP for load-unpacked install.
 */
export async function downloadSecurityExtension() {
  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(MANIFEST, null, 2));
  zip.file("popup.html", POPUP_HTML);
  zip.file("popup.css", POPUP_CSS);
  zip.file("popup.js", POPUP_JS);
  zip.file("README.md", README);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "thesis-security-seatbelt-extension.zip";
  a.click();
  URL.revokeObjectURL(url);
  await logEvent("export.extension", { message: "thesis-security-seatbelt-extension.zip" });
  return {
    ok: true,
    filename: "thesis-security-seatbelt-extension.zip",
    permissions: MANIFEST.permissions,
    install: [
      "Unzip the package",
      "chrome://extensions → Developer mode",
      "Load unpacked → select folder",
      "Pin popup → Scan text (never real seeds)",
    ],
    locality: "browser-only",
  };
}

export function extensionManifestSummary() {
  return {
    name: MANIFEST.name,
    version: MANIFEST.version,
    permissions: MANIFEST.permissions,
    host_permissions: MANIFEST.host_permissions,
    doctrine: "No key access · local pattern scan · load unpacked after review",
  };
}
