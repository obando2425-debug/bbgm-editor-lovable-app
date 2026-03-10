import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Search, Plus } from "lucide-react";
import { toast } from "sonner";

const AwardsEditor = () => {
  const { league, updateSection } = useLeague();
  const [search, setSearch] = useState("");
  const [seasonFilter, setSeason] = useState("");
  const awards = league?.awards || [];

  const filtered = useMemo(() => {
    return awards.filter((a: any, i: number) => {
      const matchSearch = !search || JSON.stringify(a).toLowerCase().includes(search.toLowerCase());
      const matchSeason = !seasonFilter || String(a.season) === seasonFilter;
      return matchSearch && matchSeason;
    });
  }, [awards, search, seasonFilter]);

  const seasons = useMemo(() => {
    const s = new Set(awards.map((a: any) => a.season).filter(Boolean));
    return Array.from(s).sort((a: any, b: any) => b - a);
  }, [awards]);

  const deleteAward = (idx: number) => {
    const updated = awards.filter((_: any, i: number) => i !== idx);
    updateSection("awards", updated);
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
    updateSection("awards", [...awards, { season, type: "mvp", name: "", team: "" }]);
    toast.success("Premio añadido");
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
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Datos</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((award: any, fIdx: number) => {
                const realIdx = awards.indexOf(award);
                return (
                  <tr key={fIdx} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-muted-foreground">{award.season ?? "—"}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                        {typeof award === "object" ? (award.type || Object.keys(award).filter(k => k !== "season")[0] || "—") : "—"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                      {JSON.stringify(award).slice(0, 100)}
                    </td>
                    <td className="p-3 flex gap-1">
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
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay premios. La sección "awards" no existe en este archivo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AwardsEditor;
