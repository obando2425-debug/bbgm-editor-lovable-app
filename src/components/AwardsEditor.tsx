import React, { useState, useMemo, useRef } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import EditSheet from "@/components/EditSheet";

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
    updated.splice(idx + 1, 0, { ...awards[idx] });
    updateSection("awards", updated);
    toast.success("Premio duplicado");
  };

  const addAward = () => {
    const season = (league?.gameAttributes as any)?.season || 2025;
    const newAward = { season, type: "mvp", name: "", team: "" };
    updateSection("awards", [...awards, newAward]);
    openEdit(awards.length);
    toast.success("Premio añadido");
  };

  // Get all editable keys from the award object
  const awardKeys = localAward ? Object.keys(localAward).filter(k => !k.startsWith("_")) : [];

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
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Datos</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((award: any) => {
                const realIdx = award._idx;
                return (
                  <tr key={realIdx} className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => openEdit(realIdx)}>
                    <td className="p-3 text-muted-foreground">{award.season ?? "—"}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                        {typeof award === "object" ? (award.type || Object.keys(award).filter((k: string) => k !== "season" && !k.startsWith("_"))[0] || "—") : "—"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                      {JSON.stringify(award, (k, v) => k.startsWith("_") ? undefined : v).slice(0, 100)}
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
          <div className="space-y-4">
            {awardKeys.map(key => {
              const val = localAward[key];
              if (typeof val === "object" && val !== null) {
                return (
                  <div key={key}>
                    <h4 className="text-xs font-display tracking-wider text-primary mb-2 uppercase">{key}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(val).map(subKey => (
                        <div key={subKey}>
                          <label className="text-xs text-muted-foreground mb-1 block">{subKey}</label>
                          <Input
                            value={val[subKey] ?? ""}
                            onChange={e => setLocalAward((prev: any) => ({
                              ...prev,
                              [key]: { ...prev[key], [subKey]: isNaN(Number(e.target.value)) || e.target.value === "" ? e.target.value : Number(e.target.value) }
                            }))}
                            className="bg-muted border-border"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{key}</label>
                  <Input
                    value={val ?? ""}
                    onChange={e => setLocalAward((prev: any) => ({
                      ...prev,
                      [key]: isNaN(Number(e.target.value)) || e.target.value === "" ? e.target.value : Number(e.target.value)
                    }))}
                    className="bg-muted border-border"
                  />
                </div>
              );
            })}
            <div>
              <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">JSON completo</h4>
              <pre className="text-[10px] bg-muted rounded-lg p-3 overflow-auto max-h-48 text-muted-foreground">
                {JSON.stringify(localAward, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </EditSheet>
    </div>
  );
};

export default AwardsEditor;
