import React, { useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Search } from "lucide-react";
import type { BBGMTeam } from "@/types/bbgm";
import { toast } from "sonner";

const TeamsEditor = () => {
  const { league, updateTeams } = useLeague();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const teams = league?.teams || [];

  const filtered = teams.map((t, i) => ({ ...t, _idx: i })).filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.region.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.abbrev.toLowerCase().includes(q);
  });

  const updateTeam = (idx: number, field: string, value: any) => {
    const updated = [...teams];
    updated[idx] = { ...updated[idx], [field]: value };
    updateTeams(updated);
  };

  const deleteTeam = (idx: number) => {
    updateTeams(teams.filter((_, i) => i !== idx));
    setEditingIdx(null);
    toast.success("Equipo eliminado");
  };

  const duplicateTeam = (idx: number) => {
    const clone = JSON.parse(JSON.stringify(teams[idx]));
    clone.tid = teams.length;
    clone.name = clone.name + " (copia)";
    clone.abbrev = clone.abbrev.slice(0, 2) + "2";
    updateTeams([...teams, clone]);
    toast.success("Equipo duplicado");
  };

  const addTeam = () => {
    const newTeam: BBGMTeam = { tid: teams.length, region: "New City", name: "Team", abbrev: "NEW", cid: 0, did: 0, pop: 1, colors: ["#ff6600", "#000000", "#ffffff"] };
    updateTeams([...teams, newTeam]);
    setEditingIdx(teams.length);
    toast.success("Equipo añadido");
  };

  const exportTeams = () => {
    const blob = new Blob([JSON.stringify(teams, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "teams.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Equipos exportados");
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar equipo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        <Button onClick={addTeam} className="gap-2">+ Añadir</Button>
        <Button onClick={exportTeams} variant="outline" size="sm" className="gap-1 text-xs">Exportar</Button>
      </div>

      <div className="text-sm text-muted-foreground mb-2">{filtered.length} equipos</div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary text-secondary-foreground">
                <th className="text-left p-3 font-medium">TID</th>
                <th className="text-left p-3 font-medium">Abrev</th>
                <th className="text-left p-3 font-medium">Región</th>
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium">Conf</th>
                <th className="text-left p-3 font-medium">Div</th>
                <th className="text-left p-3 font-medium">Pop</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(team => {
                const idx = team._idx;
                const isEditing = editingIdx === idx;
                return (
                  <React.Fragment key={idx}>
                    <tr
                      className={`border-t border-border hover:bg-muted/50 cursor-pointer transition-colors ${isEditing ? "bg-muted/70" : ""}`}
                      onClick={() => setEditingIdx(isEditing ? null : idx)}
                    >
                      <td className="p-3 text-muted-foreground">{team.tid}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">{team.abbrev}</span>
                      </td>
                      <td className="p-3 font-medium">{team.region}</td>
                      <td className="p-3">{team.name}</td>
                      <td className="p-3 text-muted-foreground">{team.cid ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{team.did ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{team.pop ?? "—"}</td>
                      <td className="p-3 flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); duplicateTeam(idx); }} className="h-7 w-7" title="Duplicar">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteTeam(idx); }} className="h-7 w-7 text-destructive" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="bg-card">
                        <td colSpan={8} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><label className="text-xs text-muted-foreground mb-1 block">Región</label><Input value={team.region} onChange={e => updateTeam(idx, "region", e.target.value)} className="bg-muted border-border" /></div>
                            <div><label className="text-xs text-muted-foreground mb-1 block">Nombre</label><Input value={team.name} onChange={e => updateTeam(idx, "name", e.target.value)} className="bg-muted border-border" /></div>
                            <div><label className="text-xs text-muted-foreground mb-1 block">Abreviación</label><Input value={team.abbrev} onChange={e => updateTeam(idx, "abbrev", e.target.value)} className="bg-muted border-border" /></div>
                            <div><label className="text-xs text-muted-foreground mb-1 block">TID</label><Input type="number" value={team.tid} onChange={e => updateTeam(idx, "tid", parseInt(e.target.value))} className="bg-muted border-border" /></div>
                            <div><label className="text-xs text-muted-foreground mb-1 block">Conference ID</label><Input type="number" value={team.cid ?? 0} onChange={e => updateTeam(idx, "cid", parseInt(e.target.value))} className="bg-muted border-border" /></div>
                            <div><label className="text-xs text-muted-foreground mb-1 block">Division ID</label><Input type="number" value={team.did ?? 0} onChange={e => updateTeam(idx, "did", parseInt(e.target.value))} className="bg-muted border-border" /></div>
                            <div><label className="text-xs text-muted-foreground mb-1 block">Población (M)</label><Input type="number" step="0.1" value={team.pop ?? 1} onChange={e => updateTeam(idx, "pop", parseFloat(e.target.value))} className="bg-muted border-border" /></div>
                            <div><label className="text-xs text-muted-foreground mb-1 block">Capacidad</label><Input type="number" value={team.stadiumCapacity ?? 25000} onChange={e => updateTeam(idx, "stadiumCapacity", parseInt(e.target.value))} className="bg-muted border-border" /></div>
                            <div><label className="text-xs text-muted-foreground mb-1 block">Estrategia</label><Input value={team.strategy ?? ""} onChange={e => updateTeam(idx, "strategy", e.target.value)} className="bg-muted border-border" /></div>
                            <div><label className="text-xs text-muted-foreground mb-1 block">Img URL</label><Input value={team.imgURL ?? ""} onChange={e => updateTeam(idx, "imgURL", e.target.value)} className="bg-muted border-border" /></div>
                            <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Colores</label><Input value={(team.colors || []).join(", ")} onChange={e => updateTeam(idx, "colors", e.target.value.split(",").map(c => c.trim()))} className="bg-muted border-border" /></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamsEditor;
