import React, { useState, useMemo, useRef } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import EditSheet from "@/components/EditSheet";

// Spanish labels for award fields
const AWARD_LABELS: Record<string, string> = {
  season: "Temporada", type: "Tipo", name: "Nombre", team: "Equipo",
  pid: "ID Jugador", tid: "ID Equipo", pts: "Puntos", trb: "Rebotes",
  ast: "Asistencias", stl: "Robos", blk: "Tapones",
  mvp: "MVP", dpoy: "Defensor del Año", smoy: "Sexto Hombre",
  mip: "Más Mejorado", roy: "Novato del Año", finalsMvp: "MVP de Finales",
  allLeague: "All-League", allDefensive: "All-Defensive", allRookie: "All-Rookie",
  firstName: "Nombre", lastName: "Apellido",
};

const TYPE_LABELS: Record<string, string> = {
  mvp: "MVP", dpoy: "Defensor del Año", smoy: "Sexto Hombre",
  mip: "Más Mejorado", roy: "Novato del Año", finalsMvp: "MVP Finales",
  allLeague: "All-League", allDefensive: "All-Defensive", allRookie: "All-Rookie",
  champion: "Campeón",
};

const getAwardSummary = (award: any): string => {
  if (!award || typeof award !== "object") return "—";
  // Named award (has keys like mvp, dpoy, etc.)
  const namedKeys = ["mvp", "dpoy", "smoy", "mip", "roy", "finalsMvp"];
  for (const k of namedKeys) {
    if (award[k]) {
      const p = award[k];
      return `${TYPE_LABELS[k] || k}: ${p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "—"}`;
    }
  }
  // Type-based
  if (award.type) return TYPE_LABELS[award.type] || award.type;
  if (award.name) return award.name;
  return Object.keys(award).filter(k => !k.startsWith("_") && k !== "season").slice(0, 3).join(", ");
};

const renderAwardee = (val: any): string => {
  if (!val) return "—";
  if (typeof val === "string") return val;
  if (val.name) return val.name;
  if (val.firstName) return `${val.firstName} ${val.lastName || ""}`.trim();
  return "—";
};

const AwardsEditor = () => {
  const { league, updateSection } = useLeague();
  const [search, setSearch] = useState("");
  const [seasonFilter, setSeason] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [localAward, setLocalAward] = useState<any>(null);
  const prevAwardRef = useRef<any>(null);

  const awards = league?.awards || [];

  const filtered = useMemo(() => {
    return awards
      .map((a: any, i: number) => ({ ...a, _idx: i }))
      .filter((a: any) => {
        const matchSearch = !search || JSON.stringify(a).toLowerCase().includes(search.toLowerCase());
        const matchSeason = !seasonFilter || String(a.season) === seasonFilter;
        return matchSearch && matchSeason;
      });
  }, [awards, search, seasonFilter]);

  const seasons = useMemo(() => {
    const s = new Set(awards.map((a: any) => a.season).filter(Boolean));
    return Array.from(s).sort((a: any, b: any) => b - a);
  }, [awards]);

  const openEdit = (realIdx: number) => {
    const a = JSON.parse(JSON.stringify(awards[realIdx]));
    prevAwardRef.current = JSON.parse(JSON.stringify(awards[realIdx]));
    setLocalAward(a);
    setEditingIdx(realIdx);
  };

  const saveAward = () => {
    if (editingIdx === null || !localAward) return;
    const updated = [...awards];
    updated[editingIdx] = localAward;
    updateSection("awards", updated);
    setEditingIdx(null);
    setLocalAward(null);
    toast.success("Premio guardado");
  };

  const undoLocal = () => {
    if (prevAwardRef.current) setLocalAward(JSON.parse(JSON.stringify(prevAwardRef.current)));
  };

  const deleteAward = (idx: number) => {
    updateSection("awards", awards.filter((_: any, i: number) => i !== idx));
    toast.success("Premio eliminado");
  };

  const duplicateAward = (idx: number) => {
    const updated = [...awards];
    updated.splice(idx + 1, 0, JSON.parse(JSON.stringify(awards[idx])));
    updateSection("awards", updated);
    toast.success("Premio duplicado");
  };

  const addAward = () => {
    const season = (() => {
      const ga = league?.gameAttributes;
      if (Array.isArray(ga)) return (ga as any[]).find((a: any) => a.key === "season")?.value || 2025;
      return (ga as any)?.season || 2025;
    })();
    const newAward = { season };
    updateSection("awards", [...awards, newAward]);
    openEdit(awards.length);
    toast.success("Premio añadido");
  };

  const updateLocalField = (path: string, value: any) => {
    setLocalAward((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  const renderAwardField = (key: string, val: any, path: string = "") => {
    const fullPath = path ? `${path}.${key}` : key;
    const label = AWARD_LABELS[key] || key;

    if (key.startsWith("_")) return null;

    // Object with sub-fields (like mvp: {pid, name, ...})
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      return (
        <div key={fullPath} className="col-span-full border border-border rounded-lg p-3 mt-1">
          <h5 className="text-xs font-display tracking-wider text-primary uppercase mb-2">{label}</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(val).map(([k, v]) => renderAwardField(k, v, fullPath))}
          </div>
        </div>
      );
    }

    // Array (like allLeague teams)
    if (Array.isArray(val)) {
      return (
        <div key={fullPath} className="col-span-full">
          <label className="text-[10px] text-muted-foreground block mb-0.5">{label} ({val.length} elementos)</label>
          <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
            {val.map((item: any, i: number) => (
              <div key={i} className="text-xs bg-muted rounded p-2">
                {typeof item === "object" ? (
                  <span>{item.name || `${item.firstName || ""} ${item.lastName || ""}`.trim() || JSON.stringify(item).slice(0, 80)}</span>
                ) : (
                  <span>{String(item)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Primitive
    return (
      <div key={fullPath}>
        <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
        {typeof val === "boolean" ? (
          <button
            onClick={() => updateLocalField(fullPath, !val)}
            className={`w-10 h-5 rounded-full transition-colors ${val ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-card shadow transition-transform ${val ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        ) : (
          <Input
            type={typeof val === "number" ? "number" : "text"}
            value={val ?? ""}
            onChange={e => updateLocalField(fullPath, typeof val === "number" ? (parseFloat(e.target.value) || 0) : e.target.value)}
            className="bg-muted border-border"
          />
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar premios..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        {seasons.length > 0 && (
          <select value={seasonFilter} onChange={e => setSeason(e.target.value)} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground">
            <option value="">Todas las temporadas</option>
            {seasons.map((s: any) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <Button onClick={addAward} className="gap-2"><Plus className="w-3.5 h-3.5" /> Añadir</Button>
      </div>

      <div className="text-sm text-muted-foreground mb-2">{filtered.length} premios</div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary text-secondary-foreground">
                <th className="text-left p-3 font-medium">Temporada</th>
                <th className="text-left p-3 font-medium">Premio</th>
                <th className="text-left p-3 font-medium">Detalle</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((award: any) => {
                const realIdx = award._idx;
                // Extract readable info
                const summary = getAwardSummary(award);
                const namedAwardees: string[] = [];
                for (const k of ["mvp", "dpoy", "smoy", "mip", "roy", "finalsMvp"]) {
                  if (award[k]) namedAwardees.push(`${TYPE_LABELS[k] || k}: ${renderAwardee(award[k])}`);
                }
                return (
                  <tr key={realIdx} className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => openEdit(realIdx)}>
                    <td className="p-3 text-muted-foreground">{award.season ?? "—"}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                        {award.type ? (TYPE_LABELS[award.type] || award.type) : (namedAwardees.length > 0 ? "Premios de temporada" : "—")}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[400px]">
                      {namedAwardees.length > 0 ? (
                        <div className="space-y-0.5">
                          {namedAwardees.slice(0, 3).map((n, i) => <div key={i}>{n}</div>)}
                          {namedAwardees.length > 3 && <div className="text-muted-foreground/50">+{namedAwardees.length - 3} más</div>}
                        </div>
                      ) : (
                        <span>{summary}</span>
                      )}
                    </td>
                    <td className="p-3 flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => duplicateAward(realIdx)} className="h-7 w-7">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteAward(realIdx)} className="h-7 w-7 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay premios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Award Edit Sheet */}
      <EditSheet
        open={editingIdx !== null}
        onClose={() => { setEditingIdx(null); setLocalAward(null); }}
        title="Editar Premio"
        description={`Temporada ${localAward?.season ?? "—"}`}
        onSave={saveAward}
        onUndo={undoLocal}
        canUndo={true}
        onImportJson={(data) => setLocalAward(data)}
        onExportJson={() => localAward}
        exportFileName="award.json"
      >
        {localAward && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(localAward)
              .filter(([k]) => !k.startsWith("_"))
              .map(([key, val]) => renderAwardField(key, val))}
          </div>
        )}
      </EditSheet>
    </div>
  );
};

export default AwardsEditor;
