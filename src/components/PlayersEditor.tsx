import React, { useState, useMemo, useRef } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Copy, GripVertical } from "lucide-react";
import type { BBGMPlayer } from "@/types/bbgm";
import { toast } from "sonner";
import EditSheet from "@/components/EditSheet";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";

const SortableRow = ({ player, idx, teamName, openEdit, duplicatePlayer, deletePlayer }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idx });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const lr = player.ratings?.[player.ratings.length - 1];

  return (
    <tr ref={setNodeRef} style={style} className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => openEdit(idx)}>
      <td className="p-2 w-8" {...attributes} {...listeners} onClick={e => e.stopPropagation()}>
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </td>
      <td className="p-3 font-medium">{player.firstName} {player.lastName}</td>
      <td className="p-3 text-muted-foreground">{player.pos || "—"}</td>
      <td className="p-3">
        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">{teamName(player.tid ?? -1)}</span>
      </td>
      <td className="p-3 text-muted-foreground">{player.age ?? "—"}</td>
      <td className="p-3 font-medium">{lr?.ovr ?? "—"}</td>
      <td className="p-3 text-primary font-medium">{lr?.pot ?? "—"}</td>
      <td className="p-3 text-muted-foreground">{player.contract ? `$${((player.contract.amount ?? 0) / 1000).toFixed(1)}M` : "—"}</td>
      <td className="p-3 flex gap-1" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" onClick={() => duplicatePlayer(idx)} className="h-7 w-7" title="Duplicar">
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => deletePlayer(idx)} className="h-7 w-7 text-destructive" title="Eliminar">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </td>
    </tr>
  );
};

const PlayersEditor = () => {
  const { league, updatePlayers } = useLeague();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [localPlayer, setLocalPlayer] = useState<any>(null);
  const prevPlayerRef = useRef<any>(null);

  const players = league?.players || [];
  const teams = league?.teams || [];

  // Listen for global search navigation
  React.useEffect(() => {
    const handler = (e: Event) => {
      const idx = (e as CustomEvent).detail?.index;
      if (typeof idx === "number" && idx < players.length) {
        openEdit(idx);
      }
    };
    window.addEventListener("bbgm-open-player", handler);
    return () => window.removeEventListener("bbgm-open-player", handler);
  }, [players]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filtered = useMemo(() => {
    return players
      .map((p, i) => ({ ...p, _idx: i }))
      .filter(p => {
        const matchSearch = !search || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) || (p.college || "").toLowerCase().includes(search.toLowerCase());
        const matchTeam = !teamFilter || String(p.tid) === teamFilter;
        const matchPos = !posFilter || (p.pos || "").toLowerCase() === posFilter.toLowerCase();
        return matchSearch && matchTeam && matchPos;
      });
  }, [players, search, teamFilter, posFilter]);

  const sortableIds = useMemo(() => filtered.map(p => p._idx), [filtered]);

  const teamName = (tid: number) => {
    if (tid === -1) return "FA";
    if (tid === -2) return "Retired";
    const team = teams.find(t => t.tid === tid);
    return team ? `${team.region} ${team.name}` : `T${tid}`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = active.id as number;
    const newIndex = over.id as number;
    updatePlayers(arrayMove(players, oldIndex, newIndex));
    toast.success("Jugador reordenado");
  };

  const openEdit = (idx: number) => {
    const p = JSON.parse(JSON.stringify(players[idx]));
    prevPlayerRef.current = JSON.parse(JSON.stringify(players[idx]));
    setLocalPlayer(p);
    setEditingIdx(idx);
  };

  const savePlayer = () => {
    if (editingIdx === null || !localPlayer) return;
    const updated = [...players];
    updated[editingIdx] = localPlayer;
    updatePlayers(updated);
    setEditingIdx(null);
    setLocalPlayer(null);
    toast.success("Jugador guardado");
  };

  const undoLocal = () => {
    if (prevPlayerRef.current) setLocalPlayer(JSON.parse(JSON.stringify(prevPlayerRef.current)));
  };

  const updateField = (field: string, value: any) => {
    setLocalPlayer((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateRatingLocal = (ratingField: string, value: number) => {
    setLocalPlayer((prev: any) => {
      if (!prev?.ratings?.length) return prev;
      const ratings = [...prev.ratings];
      ratings[ratings.length - 1] = { ...ratings[ratings.length - 1], [ratingField]: value };
      return { ...prev, ratings };
    });
  };

  const deletePlayer = (idx: number) => {
    updatePlayers(players.filter((_, i) => i !== idx));
    toast.success("Jugador eliminado");
  };

  const duplicatePlayer = (idx: number) => {
    const updated = [...players];
    const clone = JSON.parse(JSON.stringify(players[idx]));
    clone.firstName = clone.firstName + " (copia)";
    updated.splice(idx + 1, 0, clone);
    updatePlayers(updated);
    toast.success("Jugador duplicado");
  };

  const addPlayer = () => {
    const newPlayer: BBGMPlayer = {
      firstName: "Nuevo", lastName: "Jugador", pos: "PG", tid: -1, age: 22,
      hgt: 75, weight: 190, born: { year: 2004, loc: "" },
      ratings: [{ ovr: 50, pot: 60, hgt: 50, stre: 50, spd: 50, jmp: 50, endu: 50, ins: 50, dnk: 50, ft: 50, fg: 50, tp: 50, oiq: 50, diq: 50, drb: 50, pss: 50, reb: 50 }],
      contract: { amount: 1000, exp: 2025 },
    };
    const updated = [...players, newPlayer];
    updatePlayers(updated);
    openEdit(updated.length - 1);
    toast.success("Jugador añadido");
  };

  const exportPlayers = () => {
    const blob = new Blob([JSON.stringify(filtered.map(({ _idx, ...p }) => p), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "players.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Jugadores exportados");
  };

  const ratingFields = ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "oiq", "diq", "drb", "pss", "reb"];
  const lastRating = localPlayer?.ratings?.[localPlayer.ratings.length - 1];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground">
          <option value="">Todos los equipos</option>
          <option value="-1">Free Agents</option>
          <option value="-2">Retirados</option>
          {teams.map(t => <option key={t.tid} value={t.tid}>{t.abbrev}</option>)}
        </select>
        <select value={posFilter} onChange={e => setPosFilter(e.target.value)} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground">
          <option value="">Todas las pos</option>
          {["PG", "SG", "SF", "PF", "C"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <Button onClick={addPlayer} className="gap-2">+ Añadir</Button>
        <Button onClick={exportPlayers} variant="outline" size="sm" className="gap-1 text-xs">Exportar</Button>
      </div>

      <div className="text-sm text-muted-foreground mb-2">{filtered.length} jugadores</div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin max-h-[65vh]">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-secondary text-secondary-foreground">
                  <th className="p-2 w-8"></th>
                  <th className="text-left p-3 font-medium">Nombre</th>
                  <th className="text-left p-3 font-medium">Pos</th>
                  <th className="text-left p-3 font-medium">Equipo</th>
                  <th className="text-left p-3 font-medium">Edad</th>
                  <th className="text-left p-3 font-medium">OVR</th>
                  <th className="text-left p-3 font-medium">POT</th>
                  <th className="text-left p-3 font-medium">Contrato</th>
                  <th className="p-3 font-medium w-28"></th>
                </tr>
              </thead>
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <tbody>
                  {filtered.map(player => (
                    <SortableRow
                      key={player._idx}
                      player={player}
                      idx={player._idx}
                      teamName={teamName}
                      openEdit={openEdit}
                      duplicatePlayer={duplicatePlayer}
                      deletePlayer={deletePlayer}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {/* Edit Sheet */}
      <EditSheet
        open={editingIdx !== null}
        onClose={() => { setEditingIdx(null); setLocalPlayer(null); }}
        title={localPlayer ? `${localPlayer.firstName} ${localPlayer.lastName}` : "Jugador"}
        description="Edita todos los campos del jugador"
        onSave={savePlayer}
        onUndo={undoLocal}
        canUndo={true}
        onImportJson={(data) => setLocalPlayer(data)}
        onExportJson={() => localPlayer}
        exportFileName={`player-${localPlayer?.firstName || ""}.json`}
      >
        {localPlayer && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Información básica</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { f: "firstName", l: "Nombre" }, { f: "lastName", l: "Apellido" },
                  { f: "pos", l: "Posición" },
                  { f: "age", l: "Edad", t: "number" }, { f: "hgt", l: "Altura (in)", t: "number" },
                  { f: "weight", l: "Peso (lbs)", t: "number" }, { f: "jerseyNumber", l: "Jersey #" },
                  { f: "college", l: "College" }, { f: "imgURL", l: "Img URL" },
                ].map(({ f, l, t }) => (
                  <div key={f}>
                    <label className="text-xs text-muted-foreground mb-1 block">{l}</label>
                    <Input type={t || "text"} value={localPlayer[f] ?? ""} onChange={e => updateField(f, t === "number" ? parseInt(e.target.value) || 0 : e.target.value)} className="bg-muted border-border" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Equipo</label>
                  <select value={localPlayer.tid ?? -1} onChange={e => updateField("tid", parseInt(e.target.value))} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground">
                    <option value={-1}>Free Agent</option>
                    <option value={-2}>Retirado</option>
                    {teams.map(t => <option key={t.tid} value={t.tid}>{t.abbrev} — {t.region} {t.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Contrato</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Salario ($K)</label>
                  <Input type="number" value={localPlayer.contract?.amount ?? ""} onChange={e => updateField("contract", { ...localPlayer.contract, amount: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Expiración</label>
                  <Input type="number" value={localPlayer.contract?.exp ?? ""} onChange={e => updateField("contract", { ...localPlayer.contract, exp: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
                </div>
              </div>
            </div>

            {lastRating && (
              <div>
                <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Ratings</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {ratingFields.map(rf => (
                    <div key={rf}>
                      <label className="text-[10px] text-muted-foreground uppercase block mb-0.5">{rf}</label>
                      <Input type="number" min={0} max={100} value={lastRating[rf] ?? 0} onChange={e => updateRatingLocal(rf, parseInt(e.target.value) || 0)} className="bg-muted border-border h-8 text-xs" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Nacimiento</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Año</label>
                  <Input type="number" value={localPlayer.born?.year ?? ""} onChange={e => updateField("born", { ...localPlayer.born, year: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Lugar</label>
                  <Input value={localPlayer.born?.loc ?? ""} onChange={e => updateField("born", { ...localPlayer.born, loc: e.target.value })} className="bg-muted border-border" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">JSON completo</h4>
              <pre className="text-[10px] bg-muted rounded-lg p-3 overflow-auto max-h-48 text-muted-foreground">
                {JSON.stringify(localPlayer, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </EditSheet>
    </div>
  );
};

export default PlayersEditor;
