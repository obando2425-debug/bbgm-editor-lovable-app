// BBGM Merge System — merges user JSON with ghost schema
import { GHOST_LEAGUE, GHOST_PLAYER, GHOST_TEAM, GHOST_DRAFT_PICK, GHOST_GAME_ATTRIBUTES } from "./bbgm-schema";

export interface MergeResult {
  data: any;
  completedFields: string[];
  isValid: boolean;
  validationError?: string;
}

/** Validate that a JSON is a recognizable BBGM league file */
export function validateBBGMFile(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") return { valid: false, error: "El archivo no es un objeto JSON válido" };
  const coreKeys = ["players", "teams", "gameAttributes", "version", "startingSeason"];
  const hasCore = coreKeys.some(k => k in data);
  if (!hasCore) return { valid: false, error: "El archivo no parece ser un JSON de Basketball GM — no contiene players, teams ni gameAttributes" };
  if (data.players && !Array.isArray(data.players)) return { valid: false, error: "El campo 'players' debe ser un array" };
  if (data.teams && !Array.isArray(data.teams)) return { valid: false, error: "El campo 'teams' debe ser un array" };
  return { valid: true };
}

/** Deep merge: add missing keys from ghost to target without overwriting */
function deepMergeDefaults(target: any, ghost: any): string[] {
  const completed: string[] = [];
  if (!ghost || typeof ghost !== "object" || Array.isArray(ghost)) return completed;
  for (const key of Object.keys(ghost)) {
    // Skip undefined/null ghost values
    if (ghost[key] === undefined || ghost[key] === null) continue;
    if (!(key in target) || target[key] === undefined) {
      try {
        target[key] = JSON.parse(JSON.stringify(ghost[key]));
        completed.push(key);
      } catch {
        // Skip values that can't be serialized
      }
    } else if (typeof ghost[key] === "object" && ghost[key] !== null && !Array.isArray(ghost[key]) && typeof target[key] === "object" && target[key] !== null && !Array.isArray(target[key])) {
      const sub = deepMergeDefaults(target[key], ghost[key]);
      completed.push(...sub.map(s => `${key}.${s}`));
    }
  }
  return completed;
}

/** Safe clone that handles large objects without crashing */
function safeClone(obj: any): any {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    // For extremely large objects, use structuredClone if available
    if (typeof structuredClone === "function") {
      return structuredClone(obj);
    }
    // Last resort: shallow clone top level, deep clone only what we modify
    const clone: any = {};
    for (const key of Object.keys(obj)) {
      clone[key] = obj[key];
    }
    return clone;
  }
}

/** Merge user league JSON with ghost schema */
export function mergeWithSchema(userJson: any): MergeResult {
  const validation = validateBBGMFile(userJson);
  if (!validation.valid) {
    return { data: userJson, completedFields: [], isValid: false, validationError: validation.error };
  }

  // Use safe clone to handle large files
  const merged = safeClone(userJson);
  const completed: string[] = [];

  // Merge top-level keys from ghost
  for (const key of Object.keys(GHOST_LEAGUE)) {
    const ghostVal = GHOST_LEAGUE[key];
    if (ghostVal === undefined || ghostVal === null) continue;
    if (!(key in merged) || merged[key] === undefined) {
      try {
        merged[key] = JSON.parse(JSON.stringify(ghostVal));
        completed.push(key);
      } catch {
        // Skip if can't serialize
      }
    }
  }

  // Ensure gameAttributes has all required keys
  if (merged.gameAttributes) {
    if (Array.isArray(merged.gameAttributes)) {
      const existing = new Set((merged.gameAttributes as any[]).map((a: any) => a.key));
      for (const [key, value] of Object.entries(GHOST_GAME_ATTRIBUTES)) {
        if (!existing.has(key) && value !== undefined && value !== null) {
          try {
            merged.gameAttributes.push({ key, value: JSON.parse(JSON.stringify(value)) });
            completed.push(`gameAttributes.${key}`);
          } catch {
            // Skip if can't serialize
          }
        }
      }
    } else {
      const gaCompleted = deepMergeDefaults(merged.gameAttributes, GHOST_GAME_ATTRIBUTES);
      completed.push(...gaCompleted.map(k => `gameAttributes.${k}`));
    }
  }

  // Merge player defaults (only structural, not value overwrite)
  if (Array.isArray(merged.players)) {
    for (const player of merged.players) {
      deepMergeDefaults(player, GHOST_PLAYER);
    }
  }

  // Merge team defaults
  if (Array.isArray(merged.teams)) {
    for (const team of merged.teams) {
      deepMergeDefaults(team, GHOST_TEAM);
    }
  }

  return { data: merged, completedFields: completed, isValid: true };
}
