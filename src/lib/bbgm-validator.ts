// BBGM Validator — validates and auto-corrects JSON data
import { VALIDATION_RULES, GHOST_PLAYER } from "./bbgm-schema";

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
}

/** Validate the full league JSON and optionally auto-correct */
export function validateLeague(league: any, autoCorrect = true): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!league) return issues;

  const teams = league.teams || [];
  const validTids = new Set(teams.map((t: any) => t.tid));
  validTids.add(-1); // free agent
  validTids.add(-2); // retired
  validTids.add(-3); // retired (hall of fame variation)

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
          element: name, oldValue: p.tid,
        });
        if (autoCorrect) {
          p.tid = -1;
          issues[issues.length - 1].newValue = -1;
          issues[issues.length - 1].autoFixed = true;
        }
      }

      // Validate ratings
      if (Array.isArray(p.ratings)) {
        for (const rating of p.ratings) {
          for (const rField of ["hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "oiq", "diq", "drb", "pss", "reb", "ovr", "pot"]) {
            const rule = VALIDATION_RULES[`player.ratings.${rField}`];
            if (rule && typeof rating[rField] === "number") {
              if (rating[rField] < (rule.min ?? 0) || rating[rField] > (rule.max ?? 100)) {
                const clamped = Math.max(rule.min ?? 0, Math.min(rule.max ?? 100, rating[rField]));
                issues.push({
                  id: `p-${i}-r-${rField}`, severity: "warning", section: "players", field: `ratings.${rField}`,
                  message: `${name}: ${rField}=${rating[rField]} fuera de rango [${rule.min}-${rule.max}]`,
                  element: name, oldValue: rating[rField],
                });
                if (autoCorrect) {
                  rating[rField] = clamped;
                  issues[issues.length - 1].newValue = clamped;
                  issues[issues.length - 1].autoFixed = true;
                }
              }
            }
          }
        }
      }

      // Validate contract
      if (p.contract) {
        if (typeof p.contract.amount === "number" && p.contract.amount < 0) {
          issues.push({
            id: `p-${i}-contract`, severity: "error", section: "players", field: "contract.amount",
            message: `${name}: contrato negativo (${p.contract.amount})`,
            element: name, oldValue: p.contract.amount,
          });
          if (autoCorrect) {
            p.contract.amount = 750;
            issues[issues.length - 1].newValue = 750;
            issues[issues.length - 1].autoFixed = true;
          }
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
        issues.push({
          id: `t-${i}-dup`, severity: "error", section: "teams", field: "tid",
          message: `${teamName}: tid=${t.tid} duplicado`, element: teamName,
        });
      }
      tids.add(t.tid);

      if (!t.region || !t.name || !t.abbrev) {
        issues.push({
          id: `t-${i}-name`, severity: "warning", section: "teams", field: "name",
          message: `${teamName}: faltan campos básicos (region/name/abbrev)`, element: teamName,
        });
      }
    }
  }

  // Validate draftPicks
  if (Array.isArray(league.draftPicks)) {
    for (let i = 0; i < league.draftPicks.length; i++) {
      const dp = league.draftPicks[i];
      if (dp.tid >= 0 && !validTids.has(dp.tid)) {
        issues.push({
          id: `dp-${i}-tid`, severity: "warning", section: "draftPicks", field: "tid",
          message: `Draft pick ${i}: tid=${dp.tid} no es un equipo válido`,
        });
      }
    }
  }

  return issues;
}

/** Generate a diagnostic report */
export function generateDiagnosticReport(league: any): {
  totalFields: number;
  complete: number;
  empty: number;
  errors: number;
  warnings: number;
  completionPercent: number;
  issues: ValidationIssue[];
  sectionBreakdown: Record<string, { total: number; complete: number; errors: number }>;
} {
  const issues = validateLeague(league, false);
  const errors = issues.filter(i => i.severity === "error").length;
  const warnings = issues.filter(i => i.severity === "warning").length;

  const sections: Record<string, { total: number; complete: number; errors: number }> = {
    players: { total: (league?.players || []).length, complete: 0, errors: 0 },
    teams: { total: (league?.teams || []).length, complete: 0, errors: 0 },
    draftPicks: { total: (league?.draftPicks || []).length, complete: 0, errors: 0 },
    gameAttributes: { total: 0, complete: 0, errors: 0 },
    awards: { total: (league?.awards || []).length, complete: 0, errors: 0 },
    events: { total: (league?.events || []).length, complete: 0, errors: 0 },
  };

  // Count gameAttributes
  if (league?.gameAttributes) {
    if (Array.isArray(league.gameAttributes)) {
      sections.gameAttributes.total = league.gameAttributes.length;
      sections.gameAttributes.complete = league.gameAttributes.filter((a: any) => a.value !== undefined && a.value !== null && a.value !== "").length;
    } else {
      const keys = Object.keys(league.gameAttributes);
      sections.gameAttributes.total = keys.length;
      sections.gameAttributes.complete = keys.filter(k => league.gameAttributes[k] !== undefined && league.gameAttributes[k] !== null).length;
    }
  }

  // Count player completion
  for (const p of (league?.players || [])) {
    const hasRatings = Array.isArray(p.ratings) && p.ratings.length > 0;
    const hasContract = p.contract && p.contract.amount;
    const hasName = p.firstName && p.lastName;
    if (hasRatings && hasContract && hasName) sections.players.complete++;
  }

  // Count team completion
  for (const t of (league?.teams || [])) {
    if (t.region && t.name && t.abbrev) sections.teams.complete++;
  }

  for (const issue of issues) {
    if (sections[issue.section]) {
      sections[issue.section].errors += issue.severity === "error" ? 1 : 0;
    }
  }

  const totalFields = Object.values(sections).reduce((s, v) => s + v.total, 0);
  const complete = Object.values(sections).reduce((s, v) => s + v.complete, 0);
  const empty = totalFields - complete;
  const completionPercent = totalFields > 0 ? Math.round((complete / totalFields) * 100) : 0;

  return { totalFields, complete, empty, errors, warnings, completionPercent, issues, sectionBreakdown: sections };
}
