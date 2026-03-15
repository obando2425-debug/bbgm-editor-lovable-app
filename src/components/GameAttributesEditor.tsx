import React, { useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight } from "lucide-react";

const CATEGORIES: { name: string; fields: { key: string; label: string; type: "text" | "number" | "boolean" | "select"; options?: string[] }[] }[] = [
  {
    name: "Liga",
    fields: [
      { key: "leagueName", label: "Nombre de Liga", type: "text" },
      { key: "season", label: "Temporada", type: "number" },
      { key: "startingSeason", label: "Temporada Inicial", type: "number" },
      { key: "phase", label: "Fase", type: "number" },
      { key: "nextPhase", label: "Siguiente Fase", type: "number" },
      { key: "gameOver", label: "Game Over", type: "boolean" },
      { key: "godMode", label: "God Mode", type: "boolean" },
      { key: "godModeInPast", label: "God Mode en Pasado", type: "boolean" },
      { key: "otherTeamsWantToHire", label: "Otros equipos quieren contratarte", type: "boolean" },
    ],
  },
  {
    name: "Juego",
    fields: [
      { key: "numGames", label: "Juegos por Temporada", type: "number" },
      { key: "numGamesPlayoffSeries", label: "Juegos por Serie Playoff", type: "text" },
      { key: "numPlayoffByes", label: "Byes en Playoffs", type: "number" },
      { key: "numPlayoffRounds", label: "Rondas de Playoff", type: "number" },
      { key: "confs", label: "Conferencias (JSON)", type: "text" },
      { key: "divs", label: "Divisiones (JSON)", type: "text" },
      { key: "quarterLength", label: "Duración de Cuarto (min)", type: "number" },
      { key: "numPeriods", label: "Períodos", type: "number" },
      { key: "pace", label: "Ritmo de Juego", type: "number" },
      { key: "threePointers", label: "Triples", type: "boolean" },
      { key: "foulsNeededToFoulOut", label: "Faltas para Eliminación", type: "number" },
      { key: "foulsUntilBonus", label: "Faltas hasta Bonus", type: "text" },
    ],
  },
  {
    name: "Equipos",
    fields: [
      { key: "numActiveTeams", label: "Equipos Activos", type: "number" },
      { key: "numTeams", label: "Total de Equipos", type: "number" },
      { key: "equalizeRegions", label: "Ecualizar Regiones", type: "boolean" },
      { key: "stopOnInjury", label: "Detener por Lesión", type: "boolean" },
      { key: "stopOnInjuryGames", label: "Juegos de Lesión para Detener", type: "number" },
      { key: "aiTradesFactor", label: "Factor Trades IA", type: "number" },
      { key: "aiJerseyRetirement", label: "Retiro de Jersey IA", type: "boolean" },
    ],
  },
  {
    name: "Jugadores",
    fields: [
      { key: "maxRosterSize", label: "Máximo Roster", type: "number" },
      { key: "minRosterSize", label: "Mínimo Roster", type: "number" },
      { key: "numDraftRounds", label: "Rondas de Draft", type: "number" },
      { key: "draftType", label: "Tipo de Draft", type: "text" },
      { key: "playersRefuseToNegotiate", label: "Jugadores Rechazan Negociar", type: "boolean" },
      { key: "rookieContractLengths", label: "Duración Contrato Novato", type: "text" },
      { key: "tragicDeathRate", label: "Tasa de Muerte Trágica", type: "number" },
      { key: "brotherRate", label: "Tasa de Hermanos", type: "number" },
      { key: "sonRate", label: "Tasa de Hijos", type: "number" },
      { key: "injuryRate", label: "Tasa de Lesiones", type: "number" },
      { key: "hardCap", label: "Hard Cap", type: "boolean" },
    ],
  },
  {
    name: "Finanzas",
    fields: [
      { key: "salaryCap", label: "Tope Salarial ($K)", type: "number" },
      { key: "minPayroll", label: "Nómina Mínima ($K)", type: "number" },
      { key: "luxuryPayroll", label: "Impuesto de Lujo ($K)", type: "number" },
      { key: "luxuryTax", label: "Tasa Impuesto de Lujo", type: "number" },
      { key: "minContract", label: "Contrato Mínimo ($K)", type: "number" },
      { key: "maxContract", label: "Contrato Máximo ($K)", type: "number" },
      { key: "budget", label: "Budget habilitado", type: "boolean" },
    ],
  },
  {
    name: "Otros",
    fields: [
      { key: "difficulty", label: "Dificultad (-1 a 1)", type: "number" },
      { key: "lid", label: "League ID", type: "number" },
      { key: "userTid", label: "Equipo del Usuario (TID)", type: "number" },
      { key: "userTids", label: "TIDs del Usuario", type: "text" },
      { key: "autoDeleteOldBoxScores", label: "Borrar Box Scores Antiguos", type: "boolean" },
      { key: "hofFactor", label: "Factor Hall of Fame", type: "number" },
      { key: "allStarGame", label: "All-Star Game", type: "text" },
      { key: "challengeNoDraftPicks", label: "Reto: Sin Draft Picks", type: "boolean" },
      { key: "challengeNoFreeAgents", label: "Reto: Sin Free Agents", type: "boolean" },
      { key: "challengeNoRatings", label: "Reto: Sin Ratings", type: "boolean" },
      { key: "challengeNoTrades", label: "Reto: Sin Trades", type: "boolean" },
      { key: "challengeLoseBestPlayer", label: "Reto: Pierde Mejor Jugador", type: "boolean" },
      { key: "challengeFiredLuxuryTax", label: "Reto: Despedido Luxury Tax", type: "boolean" },
      { key: "challengeFiredMissPlayoffs", label: "Reto: Despedido Sin Playoffs", type: "boolean" },
      { key: "repeatSeason", label: "Repetir Temporada", type: "text" },
      { key: "ties", label: "Empates Permitidos", type: "boolean" },
      { key: "otl", label: "Overtime Loss", type: "boolean" },
    ],
  },
];

const GameAttributesEditor = () => {
  const { league, updateGameAttributes } = useLeague();
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(["Liga", "Juego"]));

  const attrs = league?.gameAttributes || {};

  const getAttrs = (): Record<string, any> => {
    if (Array.isArray(attrs)) {
      const obj: Record<string, any> = {};
      attrs.forEach((item: any) => { obj[item.key] = item.value; });
      return obj;
    }
    return attrs as Record<string, any>;
  };

  const setAttr = (key: string, value: any) => {
    if (Array.isArray(attrs)) {
      const updated = (attrs as any[]).map((item: any) =>
        item.key === key ? { ...item, value } : item
      );
      if (!updated.find((item: any) => item.key === key)) {
        updated.push({ key, value });
      }
      updateGameAttributes(updated as any);
    } else {
      updateGameAttributes({ ...attrs, [key]: value });
    }
  };

  const attrObj = getAttrs();
  const allKnownKeys = new Set(CATEGORIES.flatMap(c => c.fields.map(f => f.key)));

  const toggleCat = (name: string) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // Unrecognized keys that aren't in categories
  const unknownKeys = Object.keys(attrObj).filter(k => !allKnownKeys.has(k));

  const renderField = (key: string, label: string, type: string, value: any) => {
    if (type === "boolean") {
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
            type={type === "number" ? "number" : "text"}
            value={value ?? ""}
            onChange={e => setAttr(key, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
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
        const fieldsWithValues = cat.fields.filter(f => attrObj[f.key] !== undefined);
        return (
          <div key={cat.name} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCat(cat.name)}
              className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <span className="font-display text-sm tracking-wider text-primary uppercase">{cat.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{fieldsWithValues.length} campos</span>
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
            {isOpen && (
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.fields.map(f => renderField(f.key, f.label, f.type, attrObj[f.key]))}
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
              {unknownKeys.map(key => {
                const val = attrObj[key];
                const isSimple = typeof val !== "object" || val === null;
                return renderField(key, key, isSimple ? (typeof val === "number" ? "number" : "text") : "text", val);
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameAttributesEditor;
