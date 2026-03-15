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
  // Must have at least one of the core BBGM keys
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
    if (!(key in target) || target[key] === undefined) {
      target[key] = JSON.parse(JSON.stringify(ghost[key]));
      completed.push(key);
    } else if (typeof ghost[key] === "object" && ghost[key] !== null && !Array.isArray(ghost[key]) && typeof target[key] === "object" && target[key] !== null && !Array.isArray(target[key])) {
      const sub = deepMergeDefaults(target[key], ghost[key]);
      completed.push(...sub.map(s => `${key}.${s}`));
    }
  }
  return completed;
}

/** Merge user league JSON with ghost schema */
export function mergeWithSchema(userJson: any): MergeResult {
  const validation = validateBBGMFile(userJson);
  if (!validation.valid) {
    return { data: userJson, completedFields: [], isValid: false, validationError: validation.error };
  }

  const merged = JSON.parse(JSON.stringify(userJson));
  const completed: string[] = [];

  // Merge top-level keys from ghost
  for (const key of Object.keys(GHOST_LEAGUE)) {
    if (!(key in merged) || merged[key] === undefined) {
      merged[key] = JSON.parse(JSON.stringify(GHOST_LEAGUE[key]));
      completed.push(key);
    }
  }

  // Ensure gameAttributes has all required keys
  if (merged.gameAttributes) {
    if (Array.isArray(merged.gameAttributes)) {
      const existing = new Set((merged.gameAttributes as any[]).map((a: any) => a.key));
      for (const [key, value] of Object.entries(GHOST_GAME_ATTRIBUTES)) {
        if (!existing.has(key) && value !== undefined) {
          merged.gameAttributes.push({ key, value: JSON.parse(JSON.stringify(value)) });
          completed.push(`gameAttributes.${key}`);
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
      const playerCompleted = deepMergeDefaults(player, GHOST_PLAYER);
      // Don't report per-player completions to avoid noise
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
