import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

// Spanish labels for known gameAttributes keys
const KEY_LABELS: Record<string, string> = {
  leagueName: "Nombre de Liga", season: "Temporada", startingSeason: "Temporada Inicial",
  phase: "Fase", nextPhase: "Siguiente Fase", gameOver: "Game Over", godMode: "God Mode",
  godModeInPast: "God Mode en Pasado", otherTeamsWantToHire: "Otros equipos quieren contratarte",
  numGames: "Juegos por Temporada", numGamesPlayoffSeries: "Juegos por Serie Playoff",
  numPlayoffByes: "Byes en Playoffs", numPlayoffRounds: "Rondas de Playoff",
  quarterLength: "Duración de Cuarto (min)", numPeriods: "Períodos", pace: "Ritmo de Juego",
  threePointers: "Triples", foulsNeededToFoulOut: "Faltas para Eliminación",
  foulsUntilBonus: "Faltas hasta Bonus", numActiveTeams: "Equipos Activos",
  numTeams: "Total de Equipos", equalizeRegions: "Ecualizar Regiones",
  stopOnInjury: "Detener por Lesión", stopOnInjuryGames: "Juegos de Lesión para Detener",
  aiTradesFactor: "Factor Trades IA", aiJerseyRetirement: "Retiro de Jersey IA",
  maxRosterSize: "Máximo Roster", minRosterSize: "Mínimo Roster",
  numDraftRounds: "Rondas de Draft", draftType: "Tipo de Draft",
  playersRefuseToNegotiate: "Jugadores Rechazan Negociar",
  rookieContractLengths: "Duración Contrato Novato", tragicDeathRate: "Tasa de Muerte Trágica",
  brotherRate: "Tasa de Hermanos", sonRate: "Tasa de Hijos", injuryRate: "Tasa de Lesiones",
  hardCap: "Hard Cap", salaryCap: "Tope Salarial ($K)", minPayroll: "Nómina Mínima ($K)",
  luxuryPayroll: "Impuesto de Lujo ($K)", luxuryTax: "Tasa Impuesto de Lujo",
  minContract: "Contrato Mínimo ($K)", maxContract: "Contrato Máximo ($K)",
  budget: "Budget habilitado", difficulty: "Dificultad (-1 a 1)", lid: "League ID",
  userTid: "Equipo del Usuario (TID)", userTids: "TIDs del Usuario",
  autoDeleteOldBoxScores: "Borrar Box Scores Antiguos", hofFactor: "Factor Hall of Fame",
  allStarGame: "All-Star Game", challengeNoDraftPicks: "Reto: Sin Draft Picks",
  challengeNoFreeAgents: "Reto: Sin Free Agents", challengeNoRatings: "Reto: Sin Ratings",
  challengeNoTrades: "Reto: Sin Trades", challengeLoseBestPlayer: "Reto: Pierde Mejor Jugador",
  challengeFiredLuxuryTax: "Reto: Despedido Luxury Tax",
  challengeFiredMissPlayoffs: "Reto: Despedido Sin Playoffs",
  repeatSeason: "Repetir Temporada", ties: "Empates Permitidos", otl: "Overtime Loss",
  spectator: "Espectador", tradeDeadline: "Deadline de Trades",
  autoRelocate: "Reubicación automática", playoffsByConf: "Playoffs por Conferencia",
  playIn: "Play-In Tournament", numPlayersDunk: "Jugadores en Concurso de Mates",
  numPlayersThree: "Jugadores en Concurso de Triples", realStats: "Stats Reales",
  realDraftRatings: "Ratings de Draft Reales", homeCourtAdvantage: "Ventaja de Local",
  rookiesCanRefuse: "Novatos Pueden Rechazar", forceRetireAge: "Edad Retiro Forzado",
  forceRetireSeasons: "Temporadas Retiro Forzado", salaryCapType: "Tipo de Tope Salarial",
  numSeasonsFutureDraftPicks: "Temporadas Futuras de Draft Picks",
  draftAges: "Edades de Draft", draftPickAutoContract: "Contrato Automático Draft Pick",
  inflationAvg: "Inflación Promedio", inflationMax: "Inflación Máxima",
  inflationMin: "Inflación Mínima", inflationStd: "Desviación Inflación",
  elam: "Regla Elam", elamASG: "Elam en All-Star", elamPoints: "Puntos Elam",
  pointsFormula: "Fórmula de Puntos", realPlayerDeterminism: "Determinismo Jugadores Reales",
  tradeAbovePayrollTax: "Tradear Sobre Impuesto Nómina",
  confs: "Conferencias", divs: "Divisiones",
};

const CATEGORIES: { name: string; keys: string[] }[] = [
  {
    name: "Liga",
    keys: ["leagueName", "season", "startingSeason", "phase", "nextPhase", "gameOver", "godMode", "godModeInPast", "otherTeamsWantToHire", "lid"],
  },
  {
    name: "Juego",
    keys: ["numGames", "numGamesPlayoffSeries", "numPlayoffByes", "numPlayoffRounds", "quarterLength", "numPeriods", "pace", "threePointers", "foulsNeededToFoulOut", "foulsUntilBonus", "elam", "elamASG", "elamPoints", "tradeDeadline"],
  },
  {
    name: "Conferencias y Divisiones",
    keys: ["confs", "divs"],
  },
  {
    name: "Equipos",
    keys: ["numActiveTeams", "numTeams", "equalizeRegions", "stopOnInjury", "stopOnInjuryGames", "aiTradesFactor", "aiJerseyRetirement", "autoRelocate"],
  },
  {
    name: "Jugadores",
    keys: ["maxRosterSize", "minRosterSize", "numDraftRounds", "draftType", "draftAges", "draftPickAutoContract", "playersRefuseToNegotiate", "rookieContractLengths", "rookiesCanRefuse", "tragicDeathRate", "brotherRate", "sonRate", "injuryRate", "hardCap", "forceRetireAge", "forceRetireSeasons"],
  },
  {
    name: "Finanzas",
    keys: ["salaryCap", "minPayroll", "luxuryPayroll", "luxuryTax", "minContract", "maxContract", "salaryCapType", "budget"],
  },
  {
    name: "Retos",
    keys: ["challengeNoDraftPicks", "challengeNoFreeAgents", "challengeNoRatings", "challengeNoTrades", "challengeLoseBestPlayer", "challengeFiredLuxuryTax", "challengeFiredMissPlayoffs"],
  },
  {
    name: "Otros",
    keys: ["difficulty", "userTid", "userTids", "autoDeleteOldBoxScores", "hofFactor", "allStarGame", "spectator", "playoffsByConf", "playIn", "numPlayersDunk", "numPlayersThree", "realStats", "realDraftRatings", "homeCourtAdvantage", "inflationAvg", "inflationMax", "inflationMin", "inflationStd", "numSeasonsFutureDraftPicks", "pointsFormula", "realPlayerDeterminism", "repeatSeason", "ties", "otl", "tradeAbovePayrollTax"],
  },
];

const GameAttributesEditor = () => {
  const { league, updateGameAttributes } = useLeague();
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(["Liga", "Juego"]));

  const attrs = league?.gameAttributes;

  const getAttrs = (): Record<string, any> => {
    if (!attrs) return {};
    if (Array.isArray(attrs)) {
      const obj: Record<string, any> = {};
      (attrs as any[]).forEach((item: any) => { if (item && item.key !== undefined) obj[item.key] = item.value; });
      return obj;
    }
    return attrs as Record<string, any>;
  };

  const setAttr = (key: string, value: any) => {
    if (Array.isArray(attrs)) {
      const updated = [...(attrs as any[])];
      const idx = updated.findIndex((a: any) => a.key === key);
      if (idx !== -1) updated[idx] = { ...updated[idx], value };
      else updated.push({ key, value });
      updateGameAttributes(updated as any);
    } else {
      updateGameAttributes({ ...(attrs || {}), [key]: value } as any);
    }
  };

  const attrObj = getAttrs();
  const allCatKeys = new Set(CATEGORIES.flatMap(c => c.keys));

  const toggleCat = (name: string) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // Unknown keys not in categories
  const unknownKeys = Object.keys(attrObj).filter(k => !allCatKeys.has(k));

  const renderConfsEditor = () => {
    const confs = attrObj.confs;
    if (!Array.isArray(confs)) return <p className="text-xs text-muted-foreground">Sin conferencias definidas</p>;
    return (
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground mb-1 block">Conferencias</label>
        {confs.map((conf: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={conf.name || ""}
              onChange={e => {
                const updated = [...confs];
                updated[i] = { ...updated[i], name: e.target.value };
                setAttr("confs", updated);
              }}
              className="bg-muted border-border flex-1"
              placeholder="Nombre"
            />
            <span className="text-xs text-muted-foreground">CID: {conf.cid}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setAttr("confs", confs.filter((_: any, j: number) => j !== i))}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setAttr("confs", [...confs, { cid: confs.length, name: "Nueva Conferencia" }])} className="gap-1 text-xs">
          <Plus className="w-3 h-3" /> Añadir Conferencia
        </Button>
      </div>
    );
  };

  const renderDivsEditor = () => {
    const divs = attrObj.divs;
    const confs = attrObj.confs || [];
    if (!Array.isArray(divs)) return <p className="text-xs text-muted-foreground">Sin divisiones definidas</p>;
    return (
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground mb-1 block">Divisiones</label>
        {divs.map((div: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={div.name || ""}
              onChange={e => {
                const updated = [...divs];
                updated[i] = { ...updated[i], name: e.target.value };
                setAttr("divs", updated);
              }}
              className="bg-muted border-border flex-1"
              placeholder="Nombre"
            />
            <select
              value={div.cid ?? 0}
              onChange={e => {
                const updated = [...divs];
                updated[i] = { ...updated[i], cid: parseInt(e.target.value) };
                setAttr("divs", updated);
              }}
              className="bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
            >
              {Array.isArray(confs) ? confs.map((c: any) => (
                <option key={c.cid} value={c.cid}>{c.name || `Conf ${c.cid}`}</option>
              )) : <option value={0}>Conf 0</option>}
            </select>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setAttr("divs", divs.filter((_: any, j: number) => j !== i))}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setAttr("divs", [...divs, { did: divs.length, cid: 0, name: "Nueva División" }])} className="gap-1 text-xs">
          <Plus className="w-3 h-3" /> Añadir División
        </Button>
      </div>
    );
  };

  const renderField = (key: string, value: any) => {
    const label = KEY_LABELS[key] || key;
    
    // Special handlers for confs and divs
    if (key === "confs") return <div key={key} className="col-span-full">{renderConfsEditor()}</div>;
    if (key === "divs") return <div key={key} className="col-span-full">{renderDivsEditor()}</div>;

    if (typeof value === "boolean") {
      return (
        <div key={key} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
          <label className="text-xs text-muted-foreground">{label}</label>
          <button
            onClick={() => setAttr(key, !value)}
            className={`w-10 h-5 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-card shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      );
    }
    const isComplex = typeof value === "object" && value !== null;
    return (
      <div key={key} className="bg-card rounded-lg p-3 border border-border">
        <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
        {isComplex ? (
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={e => { try { setAttr(key, JSON.parse(e.target.value)); } catch {} }}
            className="w-full bg-muted border border-border rounded-md p-2 text-xs font-mono text-foreground h-20 resize-y scrollbar-thin"
          />
        ) : (
          <Input
            type={typeof value === "number" ? "number" : "text"}
            value={value ?? ""}
            onChange={e => setAttr(key, typeof value === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
            className="bg-muted border-border"
          />
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-3">
      {CATEGORIES.map(cat => {
        const isOpen = openCats.has(cat.name);
        // Count fields that exist in the data
        const existingKeys = cat.keys.filter(k => attrObj[k] !== undefined);
        return (
          <div key={cat.name} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCat(cat.name)}
              className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <span className="font-display text-sm tracking-wider text-primary uppercase">{cat.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{existingKeys.length}/{cat.keys.length} campos</span>
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
            {isOpen && (
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.keys.map(key => renderField(key, attrObj[key]))}
              </div>
            )}
          </div>
        );
      })}

      {unknownKeys.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCat("_unknown")}
            className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <span className="font-display text-sm tracking-wider text-muted-foreground uppercase">Atributos Adicionales</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{unknownKeys.length}</span>
              {openCats.has("_unknown") ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>
          {openCats.has("_unknown") && (
            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {unknownKeys.map(key => renderField(key, attrObj[key]))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameAttributesEditor;
