// BBGM Snapshot/Version Control System

export interface Snapshot {
  id: string;
  timestamp: number;
  description: string;
  size: number;
  data: string; // compressed JSON string
}

const SNAPSHOTS_KEY = "bbgm-snapshots";
const MAX_SNAPSHOTS = 50;

let snapshots: Snapshot[] = [];
try { snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]"); } catch { snapshots = []; }

function persist() {
  try {
    // Keep only metadata in main key, data in separate keys
    const meta = snapshots.map(({ data, ...rest }) => rest);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(meta));
    // Store data separately (may fail for large JSONs)
    for (const s of snapshots) {
      try { localStorage.setItem(`bbgm-snap-${s.id}`, s.data); } catch { break; }
    }
    // Clean up old data
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("bbgm-snap-") && !snapshots.find(s => `bbgm-snap-${s.id}` === key)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

export function createSnapshot(league: any, description: string): Snapshot | null {
  try {
    const data = JSON.stringify(league);
    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description,
      size: data.length,
      data,
    };
    snapshots = [snapshot, ...snapshots].slice(0, MAX_SNAPSHOTS);
    persist();
    return snapshot;
  } catch {
    return null;
  }
}

export function getSnapshots(): Omit<Snapshot, "data">[] {
  return snapshots.map(({ data, ...rest }) => rest);
}

export function loadSnapshotData(id: string): any | null {
  try {
    const data = localStorage.getItem(`bbgm-snap-${id}`);
    if (data) return JSON.parse(data);
    const snap = snapshots.find(s => s.id === id);
    if (snap?.data) return JSON.parse(snap.data);
  } catch {}
  return null;
}

export function deleteSnapshot(id: string) {
  snapshots = snapshots.filter(s => s.id !== id);
  try { localStorage.removeItem(`bbgm-snap-${id}`); } catch {}
  persist();
}
