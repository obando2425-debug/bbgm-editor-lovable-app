// BBGM Validator — validates and auto-corrects JSON data
import { VALIDATION_RULES, GHOST_PLAYER } from "./bbgm-schema";
import { addNotification } from "./bbgm-notifications";

export interface ValidationIssue {
  id: string;
  severity: "error" | "warning" | "info";
  section: string;
  field: string;
  message: string;
  element?: string;
  oldValue?: any;
  newValue?: any;
  autoFixed?: boolean;
  fixFn?: string; // identifier for individual fix
}

/** Validate the full league JSON and optionally auto-correct */
export function validateLeague(league: any, autoCorrect = true): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!league) return issues;

  const teams = league.teams || [];
  const validTids = new Set(teams.map((t: any) => t.tid));
  validTids.add(-1); validTids.add(-2); validTids.add(-3);

  // Validate players
  if (Array.isArray(league.players)) {
    for (let i = 0; i < league.players.length; i++) {
      const p = league.players[i];
      const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || `Player #${i}`;

      // tid must be valid
      if (p.tid !== undefined && !validTids.has(p.tid) && p.tid >= 0) {
        issues.push({
          id: `p-${i}-tid`, severity: "error", section: "players", field: "tid",
          message: `${name}: tid=${p.tid} no corresponde a ningún equipo existente`,
          element: name, oldValue: p.tid, fixFn: `fix-player-tid-${i}`,
        });
        if (autoCorrect) { p.tid = -1; issues[issues.length - 1].newValue = -1; issues[issues.length - 1].autoFixed = true; }
      }

      // Missing essential fields
      if (!p.firstName || !p.lastName) {
        issues.push({ id: `p-${i}-name`, severity: "warning", section: "players", field: "name", message: `Jugador #${i}: falta nombre o apellido`, element: name });
      }
      if (!p.ratings || !Array.isArray(p.ratings) || p.ratings.length === 0) {
        issues.push({ id: `p-${i}-ratings`, severity: "error", section: "players", field: "ratings", message: `${name}: sin ratings`, element: name });
      }
      if (!p.contract || !p.contract.amount) {
        issues.push({ id: `p-${i}-contract-missing`, severity: "warning", section: "players", field: "contract", message: `${name}: sin contrato definido`, element: name });
      }
      if (!p.born || !p.born.year) {
        issues.push({ id: `p-${i}-born`, severity: "info", section: "players", field: "born", message: `${name}: falta año de nacimiento`, element: name });
      }

      // Validate ratings
      if (Array.isArray(p.ratings)) {
        for (const rating of p.ratings) {
          for (const rField of ["hgt","stre","spd","jmp","endu","ins","dnk","ft","fg","tp","oiq","diq","drb","pss","reb","ovr","pot"]) {
            const rule = VALIDATION_RULES[`player.ratings.${rField}`];
            if (rule && typeof rating[rField] === "number") {
              if (rating[rField] < (rule.min ?? 0) || rating[rField] > (rule.max ?? 100)) {
                const clamped = Math.max(rule.min ?? 0, Math.min(rule.max ?? 100, rating[rField]));
                issues.push({
                  id: `p-${i}-r-${rField}`, severity: "warning", section: "players", field: `ratings.${rField}`,
                  message: `${name}: ${rField}=${rating[rField]} fuera de rango [${rule.min}-${rule.max}]`,
                  element: name, oldValue: rating[rField],
                });
                if (autoCorrect) { rating[rField] = clamped; issues[issues.length - 1].newValue = clamped; issues[issues.length - 1].autoFixed = true; }
              }
            }
          }
        }
      }

      // Validate contract amount
      if (p.contract) {
        if (typeof p.contract.amount === "number" && p.contract.amount < 0) {
          issues.push({
            id: `p-${i}-contract`, severity: "error", section: "players", field: "contract.amount",
            message: `${name}: contrato negativo (${p.contract.amount})`, element: name, oldValue: p.contract.amount,
          });
          if (autoCorrect) { p.contract.amount = 750; issues[issues.length - 1].newValue = 750; issues[issues.length - 1].autoFixed = true; }
        }
      }
    }
  }

  // Validate teams
  if (Array.isArray(league.teams)) {
    const tids = new Set<number>();
    for (let i = 0; i < league.teams.length; i++) {
      const t = league.teams[i];
      const teamName = `${t.region || ""} ${t.name || ""}`.trim() || `Team #${i}`;

      if (tids.has(t.tid)) {
        issues.push({ id: `t-${i}-dup`, severity: "error", section: "teams", field: "tid", message: `${teamName}: tid=${t.tid} duplicado`, element: teamName });
      }
      tids.add(t.tid);

      if (!t.region || !t.name || !t.abbrev) {
        issues.push({ id: `t-${i}-name`, severity: "warning", section: "teams", field: "name", message: `${teamName}: faltan campos básicos (region/name/abbrev)`, element: teamName });
      }
      if (t.cid === undefined || t.cid === null) {
        issues.push({ id: `t-${i}-cid`, severity: "info", section: "teams", field: "cid", message: `${teamName}: falta conferencia (cid)`, element: teamName });
      }
      if (t.did === undefined || t.did === null) {
        issues.push({ id: `t-${i}-did`, severity: "info", section: "teams", field: "did", message: `${teamName}: falta división (did)`, element: teamName });
      }
    }
  }

  // Validate draftPicks
  if (Array.isArray(league.draftPicks)) {
    for (let i = 0; i < league.draftPicks.length; i++) {
      const dp = league.draftPicks[i];
      if (dp.tid >= 0 && !validTids.has(dp.tid)) {
        issues.push({ id: `dp-${i}-tid`, severity: "warning", section: "draftPicks", field: "tid", message: `Draft pick ${i}: tid=${dp.tid} no es un equipo válido` });
      }
      if (dp.originalTid >= 0 && !validTids.has(dp.originalTid)) {
        issues.push({ id: `dp-${i}-otid`, severity: "warning", section: "draftPicks", field: "originalTid", message: `Draft pick ${i}: originalTid=${dp.originalTid} no es un equipo válido` });
      }
    }
  }

  // Notify if critical issues found
  if (autoCorrect) {
    const autoFixed = issues.filter(i => i.autoFixed);
    if (autoFixed.length > 0) {
      addNotification({
        type: "warning",
        title: "Correcciones automáticas del validador",
        message: `${autoFixed.length} valores corregidos: ${autoFixed.slice(0, 3).map(i => i.message).join("; ")}`,
        persistent: true,
      });
    }
  }

  const criticalCount = issues.filter(i => i.severity === "error").length;
  if (criticalCount > 0 && !autoCorrect) {
    addNotification({
      type: "error",
      title: "Errores críticos detectados",
      message: `${criticalCount} errores en el JSON: ${issues.filter(i => i.severity === "error").slice(0, 2).map(i => i.message).join("; ")}`,
      persistent: true,
    });
  }

  return issues;
}

/** Generate a diagnostic report */
export function generateDiagnosticReport(league: any): {
  totalFields: number; complete: number; empty: number;
  errors: number; warnings: number; infos: number;
  completionPercent: number; issues: ValidationIssue[];
  sectionBreakdown: Record<string, { total: number; complete: number; errors: number }>;
} {
  const issues = validateLeague(league, false);
  const errors = issues.filter(i => i.severity === "error").length;
  const warnings = issues.filter(i => i.severity === "warning").length;
  const infos = issues.filter(i => i.severity === "info").length;

  const sections: Record<string, { total: number; complete: number; errors: number }> = {};

  // Dynamic sections from league
  const sectionKeys = ["players", "teams", "draftPicks", "gameAttributes", "awards", "events",
    "retiredPlayers", "hallOfFame", "messages", "trade", "playoffSeries", "schedule"];

  for (const key of sectionKeys) {
    const data = (league as any)?.[key];
    if (!data) { sections[key] = { total: 0, complete: 0, errors: 0 }; continue; }
    if (Array.isArray(data)) {
      sections[key] = { total: data.length, complete: 0, errors: 0 };
    } else if (typeof data === "object") {
      const keys = Object.keys(data);
      sections[key] = {
        total: keys.length,
        complete: keys.filter(k => data[k] !== undefined && data[k] !== null && data[k] !== "" && data[k] !== 0).length,
        errors: 0,
      };
    }
  }

  // gameAttributes special handling
  if (league?.gameAttributes) {
    if (Array.isArray(league.gameAttributes)) {
      sections.gameAttributes = {
        total: league.gameAttributes.length,
        complete: league.gameAttributes.filter((a: any) => a.value !== undefined && a.value !== null && a.value !== "").length,
        errors: 0,
      };
    } else {
      const keys = Object.keys(league.gameAttributes);
      sections.gameAttributes = {
        total: keys.length,
        complete: keys.filter(k => {
          const v = league.gameAttributes[k];
          return v !== undefined && v !== null && v !== "" && !(typeof v === "number" && v === 0 && !["season","startingSeason"].includes(k));
        }).length,
        errors: 0,
      };
    }
  }

  // Player completion
  for (const p of (league?.players || [])) {
    const hasRatings = Array.isArray(p.ratings) && p.ratings.length > 0;
    const hasContract = p.contract && p.contract.amount;
    const hasName = p.firstName && p.lastName;
    if (hasRatings && hasContract && hasName) sections.players.complete++;
  }

  // Team completion
  for (const t of (league?.teams || [])) {
    if (t.region && t.name && t.abbrev) sections.teams.complete++;
  }

  for (const issue of issues) {
    if (sections[issue.section]) sections[issue.section].errors += issue.severity === "error" ? 1 : 0;
  }

  const totalFields = Object.values(sections).reduce((s, v) => s + v.total, 0);
  const complete = Object.values(sections).reduce((s, v) => s + v.complete, 0);
  const empty = totalFields - complete;
  const completionPercent = totalFields > 0 ? Math.round((complete / totalFields) * 100) : 0;

  // Auto-notify critical issues
  if (errors > 0) {
    addNotification({
      type: "error",
      title: `Diagnóstico: ${errors} errores detectados`,
      message: `${errors} errores, ${warnings} advertencias, ${infos} información`,
      persistent: true,
    });
  }

  return { totalFields, complete, empty, errors, warnings, infos, completionPercent, issues, sectionBreakdown: sections };
}
