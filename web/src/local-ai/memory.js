/**
 * Local durable memory — IndexedDB, never leaves the browser.
 * Stores notes, embeddings refs, research runs, security events.
 */

const DB_NAME = "thesis-local-memory";
const DB_VERSION = 1;
const STORES = ["notes", "events", "docs", "runs"];

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: "id" });
          store.createIndex("ts", "ts", { unique: false });
          store.createIndex("kind", "kind", { unique: false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("idb open failed"));
  });
}

async function tx(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    let result;
    try {
      result = fn(store);
    } catch (e) {
      reject(e);
      return;
    }
    t.oncomplete = () => {
      db.close();
      resolve(result);
    };
    t.onerror = () => {
      db.close();
      reject(t.error);
    };
  });
}

function id(prefix = "m") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function remember(text, meta = {}) {
  const row = {
    id: id("note"),
    kind: meta.kind || "note",
    text: String(text || "").slice(0, 8000),
    embedding: meta.embedding || null,
    tags: meta.tags || [],
    source: meta.source || "user",
    ts: Date.now(),
    meta: { ...meta, embedding: undefined },
  };
  await tx("notes", "readwrite", (s) => s.put(row));
  return row;
}

export async function listNotes({ limit = 50, kind } = {}) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction("notes", "readonly");
    const store = t.objectStore("notes");
    const req = store.index("ts").openCursor(null, "prev");
    const out = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= limit) {
        db.close();
        resolve(out);
        return;
      }
      const v = cursor.value;
      if (!kind || v.kind === kind) out.push(v);
      cursor.continue();
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function logEvent(kind, detail = {}) {
  const row = {
    id: id("evt"),
    kind,
    text: typeof detail === "string" ? detail : detail.message || kind,
    detail,
    ts: Date.now(),
  };
  await tx("events", "readwrite", (s) => s.put(row));
  return row;
}

export async function listEvents({ limit = 40 } = {}) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction("events", "readonly");
    const store = t.objectStore("events");
    const req = store.index("ts").openCursor(null, "prev");
    const out = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= limit) {
        db.close();
        resolve(out);
        return;
      }
      out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function saveDoc(doc) {
  const row = {
    id: doc.id || id("doc"),
    kind: "document",
    title: doc.title || "Untitled",
    text: doc.text || "",
    format: doc.format || "markdown",
    ts: Date.now(),
    meta: doc.meta || {},
  };
  await tx("docs", "readwrite", (s) => s.put(row));
  return row;
}

export async function listDocs({ limit = 20 } = {}) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction("docs", "readonly");
    const store = t.objectStore("docs");
    const req = store.index("ts").openCursor(null, "prev");
    const out = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= limit) {
        db.close();
        resolve(out);
        return;
      }
      out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function saveRun(run) {
  const row = {
    id: run.id || id("run"),
    kind: run.kind || "research",
    text: run.summary || "",
    detail: run,
    ts: Date.now(),
  };
  await tx("runs", "readwrite", (s) => s.put(row));
  return row;
}

export async function listRuns({ limit = 20 } = {}) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction("runs", "readonly");
    const store = t.objectStore("runs");
    const req = store.index("ts").openCursor(null, "prev");
    const out = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= limit) {
        db.close();
        resolve(out);
        return;
      }
      out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function memoryStats() {
  const [notes, events, docs, runs] = await Promise.all([
    listNotes({ limit: 500 }),
    listEvents({ limit: 500 }),
    listDocs({ limit: 200 }),
    listRuns({ limit: 200 }),
  ]);
  return {
    notes: notes.length,
    events: events.length,
    docs: docs.length,
    runs: runs.length,
    lastNoteAt: notes[0]?.ts || null,
    db: DB_NAME,
    locality: "browser-only",
  };
}

/** Cosine similarity over Float32Array / number[] */
export function cosine(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function recall(queryEmbedding, { limit = 8, minScore = 0.25 } = {}) {
  const notes = await listNotes({ limit: 200 });
  if (!queryEmbedding) {
    return notes.slice(0, limit).map((n) => ({ ...n, score: 0 }));
  }
  const scored = notes
    .filter((n) => n.embedding?.length)
    .map((n) => ({ ...n, score: cosine(queryEmbedding, n.embedding) }))
    .filter((n) => n.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored;
}
