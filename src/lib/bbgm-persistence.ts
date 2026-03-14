// BBGM Persistence System — IndexedDB + Project File Save/Load

const DB_NAME = "bbgm-editor-db";
const DB_VERSION = 1;
const STORE_NAME = "session";
const SESSION_KEY = "current-session";

export interface ProjectSession {
  league: any;
  fileName: string;
  changeHistory: any[];
  snapshots: any[];
  auroraSessions: any[];
  auroraMemory: string;
  auroraInstructions: string;
  auroraFavorites: string[];
  notifications: any[];
  activeTab: string;
  savedAt: number;
  changelog: any[];
}

// ═══ IndexedDB Layer ═══

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToIndexedDB(session: ProjectSession): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(session, SESSION_KEY);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch (e) {
    console.warn("IndexedDB save failed:", e);
  }
}

export async function loadFromIndexedDB(): Promise<ProjectSession | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(SESSION_KEY);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => { db.close(); resolve(req.result || null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch (e) {
    console.warn("IndexedDB load failed:", e);
    return null;
  }
}

export async function clearIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(SESSION_KEY);
    return new Promise((resolve) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    });
  } catch (e) {
    console.warn("IndexedDB clear failed:", e);
  }
}

export async function hasIndexedDBSession(): Promise<boolean> {
  try {
    const session = await loadFromIndexedDB();
    return !!session?.league;
  } catch {
    return false;
  }
}

// ═══ Project File Layer ═══

export function gatherSessionData(): ProjectSession {
  let auroraSessions: any[] = [];
  let auroraMemory = "";
  let auroraInstructions = "";
  let auroraFavorites: string[] = [];
  let notifications: any[] = [];
  let snapshots: any[] = [];
  let changelog: any[] = [];

  try { auroraSessions = JSON.parse(localStorage.getItem("aurora-sessions") || "[]"); } catch {}
  try { auroraMemory = localStorage.getItem("aurora-memory") || ""; } catch {}
  try { auroraInstructions = localStorage.getItem("aurora-instructions") || ""; } catch {}
  try { auroraFavorites = JSON.parse(localStorage.getItem("aurora-favorites") || "[]"); } catch {}
  try { notifications = JSON.parse(localStorage.getItem("bbgm-notifications") || "[]"); } catch {}
  try { snapshots = JSON.parse(localStorage.getItem("bbgm-snapshots") || "[]"); } catch {}
  try { changelog = JSON.parse(localStorage.getItem("bbgm-changelog") || "[]"); } catch {}

  // Get snapshot data too
  const snapsWithData = snapshots.map((s: any) => {
    try {
      const data = localStorage.getItem(`bbgm-snap-${s.id}`);
      return { ...s, data: data || "" };
    } catch { return s; }
  });

  return {
    league: null, // Will be set by caller
    fileName: "",
    changeHistory: [],
    snapshots: snapsWithData,
    auroraSessions,
    auroraMemory,
    auroraInstructions,
    auroraFavorites,
    notifications,
    activeTab: "players",
    savedAt: Date.now(),
    changelog,
  };
}

export function downloadProjectFile(session: ProjectSession) {
  const blob = new Blob([JSON.stringify(session)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bbgm-project-${new Date().toISOString().slice(0, 10)}.bbgm-project.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function restoreFromProjectFile(data: ProjectSession) {
  // Restore localStorage items
  try {
    if (data.auroraSessions) localStorage.setItem("aurora-sessions", JSON.stringify(data.auroraSessions));
    if (data.auroraMemory) localStorage.setItem("aurora-memory", data.auroraMemory);
    if (data.auroraInstructions) localStorage.setItem("aurora-instructions", data.auroraInstructions);
    if (data.auroraFavorites) localStorage.setItem("aurora-favorites", JSON.stringify(data.auroraFavorites));
    if (data.notifications) localStorage.setItem("bbgm-notifications", JSON.stringify(data.notifications));
    if (data.changelog) localStorage.setItem("bbgm-changelog", JSON.stringify(data.changelog));

    // Restore snapshots
    if (data.snapshots) {
      const meta = data.snapshots.map(({ data: d, ...rest }: any) => rest);
      localStorage.setItem("bbgm-snapshots", JSON.stringify(meta));
      for (const s of data.snapshots) {
        if (s.data) {
          try { localStorage.setItem(`bbgm-snap-${s.id}`, s.data); } catch { break; }
        }
      }
    }
  } catch (e) {
    console.warn("Partial restore from project file:", e);
  }
}
