/**
 * Browser-local PDF (jsPDF) + Excel (SheetJS) generation.
 * Always security-scanned before write. Downloads only — no upload.
 */

import { assertSafe, scanText } from "./security.js";
import { logEvent, saveDoc } from "./memory.js";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function safeName(s) {
  return String(s || "thesis")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 48);
}

/** Split long text into lines for PDF */
function wrapLines(text, max = 92) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

/**
 * Generate multi-page PDF report and trigger download.
 * @returns {Promise<{ok, filename, pages, findings}>}
 */
export async function generatePdfReport({
  title = "THESIS Local Report",
  subtitle = "Browser-local · not uploaded",
  sections = [],
} = {}) {
  const blobText = [title, subtitle, ...sections.map((s) => `${s.heading}\n${s.body}`)].join("\n");
  assertSafe(blobText);
  const scan = scanText(blobText, { context: "pdf-export" });

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  let y = margin;

  const newPage = () => {
    doc.addPage();
    y = margin;
  };

  const ensure = (h = 14) => {
    if (y + h > pageH - margin) newPage();
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  ensure(20);
  doc.text(title.slice(0, 80), margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  for (const line of wrapLines(subtitle, 95)) {
    ensure(12);
    doc.text(line, margin, y);
    y += 12;
  }
  doc.setTextColor(0);
  y += 8;
  doc.setDrawColor(120);
  doc.line(margin, y, pageW - margin, y);
  y += 16;

  for (const sec of sections) {
    ensure(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(String(sec.heading || "Section").slice(0, 80), margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const body = String(sec.body || "");
    for (const para of body.split("\n")) {
      for (const line of wrapLines(para, 95)) {
        ensure(12);
        doc.text(line, margin, y);
        y += 12;
      }
      y += 4;
    }
    y += 8;
  }

  ensure(30);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `THESIS Platform · local PDF · ${new Date().toISOString()} · security score ${scan.score}`,
    margin,
    pageH - 28
  );

  const filename = `${safeName(title)}-${stamp()}.pdf`;
  doc.save(filename);
  const pages = doc.getNumberOfPages();
  await saveDoc({
    title: `${title} (PDF)`,
    text: blobText.slice(0, 12000),
    format: "pdf-meta",
    meta: { filename, pages, findings: scan.findings.length },
  });
  await logEvent("export.pdf", { message: filename, pages });
  return { ok: true, filename, pages, findings: scan.findings, locality: "browser-only" };
}

/**
 * Generate Excel workbook (.xlsx) and download.
 * sheets: [{ name, rows: array of objects or array-of-arrays }]
 */
export async function generateExcelWorkbook({
  filename = `thesis-export-${stamp()}.xlsx`,
  sheets = [],
} = {}) {
  const flat = sheets
    .map((s) => JSON.stringify(s.rows || []).slice(0, 50000))
    .join("\n");
  assertSafe(flat);
  const scan = scanText(flat, { context: "excel-export" });

  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets.length ? sheets : [{ name: "Empty", rows: [["no data"]] }]) {
    const name = String(sheet.name || "Sheet").slice(0, 31);
    let ws;
    const rows = sheet.rows || [];
    if (rows.length && !Array.isArray(rows[0]) && typeof rows[0] === "object") {
      ws = XLSX.utils.json_to_sheet(rows);
    } else {
      ws = XLSX.utils.aoa_to_sheet(rows);
    }
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  XLSX.writeFile(wb, filename);
  await saveDoc({
    title: filename,
    text: `Excel export · ${sheets.length} sheets · findings ${scan.findings.length}`,
    format: "xlsx-meta",
    meta: { filename, sheets: sheets.map((s) => s.name) },
  });
  await logEvent("export.excel", { message: filename, sheets: sheets.length });
  return { ok: true, filename, sheets: sheets.length, findings: scan.findings, locality: "browser-only" };
}

/** Convenience: security brief PDF */
export async function exportSecurityPdf(dashboard, audit) {
  return generatePdfReport({
    title: "THESIS Security Brief",
    subtitle: `Posture: ${dashboard?.posture || "—"} · alerts ${dashboard?.alerts ?? 0} · browser-local`,
    sections: [
      {
        heading: "Doctrine",
        body: dashboard?.doctrine || "Never store private keys. Owner signs. Agents propose.",
      },
      {
        heading: "Memory audit",
        body: `Scanned: ${audit?.scanned ?? 0}\nFindings: ${(audit?.findings || []).length}\nOK: ${audit?.ok ? "yes" : "NO"}`,
      },
      {
        heading: "Findings",
        body:
          (audit?.findings || [])
            .slice(0, 40)
            .map((f) => `[${f.severity}] ${f.label} · ${f.context || ""}`)
            .join("\n") || "None",
      },
      {
        heading: "Recent events",
        body:
          (dashboard?.recent || [])
            .slice(0, 20)
            .map((e) => `${e.kind}: ${e.text || e.detail?.message || ""}`)
            .join("\n") || "None",
      },
    ],
  });
}

/** Platform + local inventory Excel */
export async function exportInventoryExcel({ platform, notes, events, findings }) {
  return generateExcelWorkbook({
    filename: `thesis-inventory-${stamp()}.xlsx`,
    sheets: [
      {
        name: "Platform",
        rows: [
          { key: "product", value: platform?.product || "THESIS Platform" },
          { key: "version", value: platform?.version || "" },
          { key: "laws", value: platform?.pulse?.laws ?? "" },
          { key: "wallets", value: platform?.pulse?.wallets ?? "" },
          { key: "desk_equity", value: platform?.pulse?.desk_equity ?? "" },
          { key: "packages", value: platform?.pulse?.packages ?? "" },
          { key: "primitives_ok", value: `${platform?.kernel?.primitives_ok}/${platform?.kernel?.primitives_total}` },
        ],
      },
      {
        name: "Notes",
        rows: (notes || []).map((n) => ({
          id: n.id,
          kind: n.kind,
          text: (n.text || "").slice(0, 500),
          ts: n.ts ? new Date(n.ts).toISOString() : "",
        })),
      },
      {
        name: "Events",
        rows: (events || []).map((e) => ({
          id: e.id,
          kind: e.kind,
          text: (e.text || "").slice(0, 300),
          ts: e.ts ? new Date(e.ts).toISOString() : "",
        })),
      },
      {
        name: "Security",
        rows: (findings || []).map((f) => ({
          severity: f.severity,
          label: f.label,
          context: f.context || "",
          count: f.count || 1,
        })),
      },
    ],
  });
}

/** Research results Excel */
export async function exportResearchExcel(run) {
  return generateExcelWorkbook({
    filename: `thesis-research-${stamp()}.xlsx`,
    sheets: [
      {
        name: "Summary",
        rows: [
          { field: "query", value: run?.query || "" },
          { field: "summary", value: run?.summary || "" },
          { field: "elapsed_ms", value: run?.elapsed_ms || 0 },
          { field: "locality", value: "browser-only" },
        ],
      },
      {
        name: "Insights",
        rows: (run?.synth?.insights || []).map((i, idx) => ({
          rank: idx + 1,
          title: i.title,
          body: i.body,
        })),
      },
      {
        name: "Risks",
        rows: (run?.risk?.risks || []).map((r) => ({
          severity: r.severity,
          note: r.note,
        })),
      },
      {
        name: "MemoryHits",
        rows: (run?.scout?.memory_hits || []).map((m) => ({
          score: m.score,
          text: m.text,
        })),
      },
    ],
  });
}
