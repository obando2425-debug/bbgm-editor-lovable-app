import React from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";

const GameAttributesEditor = () => {
  const { league, updateGameAttributes } = useLeague();

  const attrs = league?.gameAttributes || {};

  // gameAttributes can be an object or array of {key, value} in some versions
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

  const knownFields = [
    { key: "leagueName", label: "Nombre de Liga", type: "text" },
    { key: "season", label: "Temporada", type: "number" },
    { key: "startingSeason", label: "Temporada Inicial", type: "number" },
    { key: "numGames", label: "Juegos por Temporada", type: "number" },
    { key: "salaryCap", label: "Salary Cap ($K)", type: "number" },
    { key: "minPayroll", label: "Min Payroll ($K)", type: "number" },
    { key: "luxuryPayroll", label: "Luxury Payroll ($K)", type: "number" },
    { key: "luxuryTax", label: "Luxury Tax", type: "number" },
    { key: "minContract", label: "Min Contract ($K)", type: "number" },
    { key: "maxContract", label: "Max Contract ($K)", type: "number" },
    { key: "numPlayoffByes", label: "Playoff Byes", type: "number" },
    { key: "numActiveTeams", label: "Equipos Activos", type: "number" },
    { key: "difficulty", label: "Dificultad", type: "number" },
  ];

  // Get all other keys not in knownFields
  const knownKeys = new Set(knownFields.map(f => f.key));
  const otherKeys = Object.keys(attrObj).filter(k => !knownKeys.has(k));

  return (
    <div className="animate-fade-in">
      <h3 className="font-display text-xl tracking-wider text-primary mb-4 uppercase">Configuración de Liga</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {knownFields.map(({ key, label, type }) => (
          <div key={key} className="bg-card rounded-lg p-3 border border-border">
            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
            <Input
              type={type}
              value={attrObj[key] ?? ""}
              onChange={e => setAttr(key, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
              className="bg-muted border-border"
            />
          </div>
        ))}
      </div>

      {otherKeys.length > 0 && (
        <>
          <h4 className="font-display text-lg tracking-wider text-muted-foreground mb-3 uppercase">Otros Atributos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto scrollbar-thin pr-2">
            {otherKeys.map(key => {
              const val = attrObj[key];
              const isSimple = typeof val === "string" || typeof val === "number" || typeof val === "boolean";
              return (
                <div key={key} className="bg-card rounded-lg p-3 border border-border">
                  <label className="text-xs text-muted-foreground mb-1 block font-mono">{key}</label>
                  {isSimple ? (
                    <Input
                      value={String(val)}
                      onChange={e => {
                        const v = e.target.value;
                        if (typeof val === "number") setAttr(key, parseFloat(v) || 0);
                        else if (typeof val === "boolean") setAttr(key, v === "true");
                        else setAttr(key, v);
                      }}
                      className="bg-muted border-border"
                    />
                  ) : (
                    <textarea
                      value={JSON.stringify(val, null, 2)}
                      onChange={e => {
                        try { setAttr(key, JSON.parse(e.target.value)); } catch {}
                      }}
                      className="w-full bg-muted border border-border rounded-md p-2 text-xs font-mono text-foreground h-24 resize-y scrollbar-thin"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default GameAttributesEditor;
