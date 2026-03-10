import React, { useState, useMemo, useRef } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Search, Users } from "lucide-react";
import type { BBGMTeam } from "@/types/bbgm";
import { toast } from "sonner";
import EditSheet from "@/components/EditSheet";

const TeamsEditor = () => {
  const { league, updateTeams, updatePlayers } = useLeague();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [rosterTid, setRosterTid] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [localTeam, setLocalTeam] = useState<any>(null);
  const prevTeamRef = useRef<any>(null);

  const teams = league?.teams || [];
  const players = league?.players || [];

  const filtered = useMemo(() => {
    return teams.filter((t): t is BBGMTeam => t != null).map((t, i) => ({ ...t, _idx: i })).filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (t.region || "").toLowerCase().includes(q) || (t.name || "").toLowerCase().includes(q) || (t.abbrev || "").toLowerCase().includes(q);
    });
  }, [teams, search]);

  const openEdit = (idx: number) => {
    const t = JSON.parse(JSON.stringify(teams[idx]));
    prevTeamRef.current = JSON.parse(JSON.stringify(teams[idx]));
    setLocalTeam(t);
    setEditingIdx(idx);
  };

  const saveTeam = () => {
    if (editingIdx === null || !localTeam) return;
    const updated = [...teams];
    updated[editingIdx] = localTeam;
    updateTeams(updated);
    setEditingIdx(null);
    setLocalTeam(null);
    toast.success("Equipo guardado");
  };

  const undoLocal = () => {
    if (prevTeamRef.current) setLocalTeam(JSON.parse(JSON.stringify(prevTeamRef.current)));
  };

  const updateField = (field: string, value: any) => {
    setLocalTeam((prev: any) => ({ ...prev, [field]: value }));
  };

  const deleteTeam = (idx: number) => {
    updateTeams(teams.filter((_, i) => i !== idx));
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
    const updated = [...teams, newTeam];
    updateTeams(updated);
    openEdit(updated.length - 1);
    toast.success("Equipo añadido");
  };

  const exportTeams = () => {
    const blob = new Blob([JSON.stringify(teams, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "teams.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Equipos exportados");
  };

  // Roster view
  const rosterPlayers = useMemo(() => {
    if (rosterTid === null) return [];
    return players.map((p: any, i: number) => ({ ...p, _idx: i })).filter((p: any) => p.tid === rosterTid);
  }, [players, rosterTid]);

  const rosterTeam = rosterTid !== null ? teams.find(t => t.tid === rosterTid) : null;

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
                <th className="p-3 w-36"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(team => {
                const idx = team._idx;
                return (
                  <tr
                    key={idx}
                    className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openEdit(idx)}
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
                    <td className="p-3 flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setRosterTid(team.tid)} className="h-7 gap-1 text-xs" title="Ver jugadores">
                        <Users className="w-3.5 h-3.5" /> Roster
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => duplicateTeam(idx)} className="h-7 w-7" title="Duplicar">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTeam(idx)} className="h-7 w-7 text-destructive" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Edit Sheet */}
      <EditSheet
        open={editingIdx !== null}
        onClose={() => { setEditingIdx(null); setLocalTeam(null); }}
        title={localTeam ? `${localTeam.region} ${localTeam.name}` : "Equipo"}
        description="Edita todos los campos del equipo"
        onSave={saveTeam}
        onUndo={undoLocal}
        canUndo={true}
        onImportJson={(data) => setLocalTeam(data)}
        onExportJson={() => localTeam}
        exportFileName={`team-${localTeam?.abbrev || ""}.json`}
      >
        {localTeam && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { f: "region", l: "Región" }, { f: "name", l: "Nombre" }, { f: "abbrev", l: "Abreviación" },
                { f: "tid", l: "TID", t: "number" }, { f: "cid", l: "Conference ID", t: "number" }, { f: "did", l: "Division ID", t: "number" },
                { f: "pop", l: "Población (M)", t: "number" }, { f: "stadiumCapacity", l: "Capacidad", t: "number" },
                { f: "strategy", l: "Estrategia" }, { f: "imgURL", l: "Img URL" }, { f: "imgURLSmall", l: "Img URL Small" },
              ].map(({ f, l, t }) => (
                <div key={f}>
                  <label className="text-xs text-muted-foreground mb-1 block">{l}</label>
                  <Input type={t || "text"} value={localTeam[f] ?? ""} onChange={e => updateField(f, t === "number" ? parseFloat(e.target.value) || 0 : e.target.value)} className="bg-muted border-border" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Colores (separados por coma)</label>
                <Input value={(localTeam.colors || []).join(", ")} onChange={e => updateField("colors", e.target.value.split(",").map((c: string) => c.trim()))} className="bg-muted border-border" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">JSON completo</h4>
              <pre className="text-[10px] bg-muted rounded-lg p-3 overflow-auto max-h-48 text-muted-foreground">
                {JSON.stringify(localTeam, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </EditSheet>

      {/* Roster Sheet */}
      <EditSheet
        open={rosterTid !== null}
        onClose={() => setRosterTid(null)}
        title={rosterTeam ? `Roster: ${rosterTeam.region} ${rosterTeam.name}` : "Roster"}
        description={`${rosterPlayers.length} jugadores en el equipo`}
        onExportJson={() => rosterPlayers.map(({ _idx, ...p }: any) => p)}
        exportFileName={`roster-${rosterTeam?.abbrev || ""}.json`}
      >
        <div className="space-y-2">
          {rosterPlayers.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">No hay jugadores en este equipo</div>
          )}
          {rosterPlayers.map((p: any) => {
            const lr = p.ratings?.[p.ratings.length - 1];
            return (
              <div key={p._idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <span className="font-medium">{p.firstName} {p.lastName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{p.pos} · {p.age}y</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span>OVR {lr?.ovr ?? "—"}</span>
                  <span className="text-primary">POT {lr?.pot ?? "—"}</span>
                  {p.contract && <span className="text-muted-foreground">${((p.contract.amount || 0) / 1000).toFixed(1)}M</span>}
                </div>
              </div>
            );
          })}
        </div>
      </EditSheet>
    </div>
  );
};

export default TeamsEditor;
