import React, { useState, useMemo, useRef } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Copy, GripVertical, ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { BBGMPlayer } from "@/types/bbgm";
import { toast } from "sonner";
import EditSheet from "@/components/EditSheet";
import { PLAYER_FIELDS } from "@/lib/bbgm-schema";
import { addNotification } from "@/lib/bbgm-notifications";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";

/** Compute age from born.year and current season */
const getAge = (player: any, season?: number): number | null => {
  if (player.age) return player.age;
  if (player.born?.year && season) return season - player.born.year;
  if (player.born?.year) return new Date().getFullYear() - player.born.year;
  return null;
};

const SortableRow = ({ player, idx, teamName, openEdit, duplicatePlayer, deletePlayer, season }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idx });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition, opacity: isDragging ? 0.5 : 1,
  };
  const lr = player.ratings?.[player.ratings.length - 1];
  const age = getAge(player, season);
  return (
    <tr ref={setNodeRef} style={style} className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => openEdit(idx)}>
      <td className="p-2 w-8" {...attributes} {...listeners} onClick={e => e.stopPropagation()}>
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </td>
      <td className="p-3 font-medium">{player.firstName} {player.lastName}</td>
      <td className="p-3 text-muted-foreground">{player.pos || "—"}</td>
      <td className="p-3"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">{teamName(player.tid ?? -1)}</span></td>
      <td className="p-3 text-muted-foreground">{age ?? "—"}</td>
      <td className="p-3 font-medium">{lr?.ovr ?? "—"}</td>
      <td className="p-3 text-primary font-medium">{lr?.pot ?? "—"}</td>
      <td className="p-3 text-muted-foreground">{player.contract ? `$${((player.contract.amount ?? 0) / 1000).toFixed(1)}M` : "—"}</td>
      <td className="p-3 text-muted-foreground text-xs">{player.injury?.type !== "Healthy" && player.injury?.type ? player.injury.type : "—"}</td>
      <td className="p-3 flex gap-1" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" onClick={() => duplicatePlayer(idx)} className="h-7 w-7" title="Duplicar"><Copy className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" onClick={() => deletePlayer(idx)} className="h-7 w-7 text-destructive" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></Button>
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
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["basic", "ratings", "contract"]));

  const players = league?.players || [];
  const teams = league?.teams || [];

  const getSeason = (): number => {
    const ga = league?.gameAttributes;
    if (Array.isArray(ga)) return (ga as any[]).find((a: any) => a.key === "season")?.value || new Date().getFullYear();
    return (ga as any)?.season || new Date().getFullYear();
  };
  const currentSeason = getSeason();

  React.useEffect(() => {
    const handler = (e: Event) => {
      const idx = (e as CustomEvent).detail?.index;
      if (typeof idx === "number" && idx < players.length) openEdit(idx);
    };
    window.addEventListener("bbgm-open-player", handler);
    return () => window.removeEventListener("bbgm-open-player", handler);
  }, [players]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filtered = useMemo(() => {
    return players.map((p, i) => ({ ...p, _idx: i })).filter(p => {
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
    if (tid === -3) return "HoF";
    const team = teams.find(t => t.tid === tid);
    return team ? (team as any).abbrev || `${(team as any).region} ${(team as any).name}` : `T${tid}`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updatePlayers(arrayMove(players, active.id as number, over.id as number));
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

  const updateNestedField = (path: string, value: any) => {
    setLocalPlayer((prev: any) => {
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
      hgt: 75, weight: 190, born: { year: currentSeason - 22, loc: "" },
      ratings: [{ ovr: 50, pot: 60, hgt: 50, stre: 50, spd: 50, jmp: 50, endu: 50, ins: 50, dnk: 50, ft: 50, fg: 50, tp: 50, oiq: 50, diq: 50, drb: 50, pss: 50, reb: 50 }],
      contract: { amount: 1000, exp: currentSeason + 2 },
      injury: { type: "Healthy", gamesRemaining: 0 },
    };
    const updated = [...players, newPlayer];
    updatePlayers(updated);
    openEdit(updated.length - 1);
    toast.success("Jugador añadido");
  };

  const exportPlayers = () => {
    const blob = new Blob([JSON.stringify(filtered.map(({ _idx, ...p }) => p), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "players.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Jugadores exportados");
  };

  const lastRating = localPlayer?.ratings?.[localPlayer.ratings.length - 1];
  const playerAge = localPlayer ? getAge(localPlayer, currentSeason) : null;

  const toggleSection = (s: string) => {
    setOpenSections(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  };

  const SectionHeader = ({ id, title }: { id: string; title: string }) => (
    <button onClick={() => toggleSection(id)} className="flex items-center gap-2 w-full">
      {openSections.has(id) ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      <h4 className="text-xs font-display tracking-wider text-primary uppercase">{title}</h4>
    </button>
  );

  // Collect unknown fields not covered by schema
  const knownKeys = new Set([
    ...PLAYER_FIELDS.basic.map(f => f.key),
    ...PLAYER_FIELDS.advanced.map(f => f.key),
    "born", "contract", "ratings", "stats", "injury", "draft", "salaries", "awards",
    "injuries", "moodTraits", "statsTids", "relatives", "transactions", "tid",
    "jerseyNumber", "college", "imgURL", "_idx",
  ]);
  const customFields = localPlayer ? Object.keys(localPlayer).filter(k => !knownKeys.has(k)) : [];

  // Relatives helper
  const addRelative = () => {
    const relatives = [...(localPlayer.relatives || []), { type: "brother", pid: 0, name: "" }];
    updateField("relatives", relatives);
  };
  const updateRelative = (idx: number, field: string, value: any) => {
    const relatives = [...(localPlayer.relatives || [])];
    relatives[idx] = { ...relatives[idx], [field]: value };
    updateField("relatives", relatives);
  };
  const removeRelative = (idx: number) => {
    updateField("relatives", (localPlayer.relatives || []).filter((_: any, i: number) => i !== idx));
  };

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
          {teams.map(t => <option key={t.tid} value={t.tid}>{(t as any).abbrev}</option>)}
        </select>
        <select value={posFilter} onChange={e => setPosFilter(e.target.value)} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground">
          <option value="">Todas las pos</option>
          {["PG", "SG", "SF", "PF", "C", "G", "GF", "F", "FC"].map(p => <option key={p} value={p}>{p}</option>)}
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
                  <th className="text-left p-3 font-medium">Lesión</th>
                  <th className="p-3 font-medium w-28"></th>
                </tr>
              </thead>
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <tbody>
                  {filtered.map(player => (
                    <SortableRow key={player._idx} player={player} idx={player._idx} teamName={teamName} openEdit={openEdit} duplicatePlayer={duplicatePlayer} deletePlayer={deletePlayer} season={currentSeason} />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

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
          <div className="space-y-4">
            {/* Basic info */}
            <SectionHeader id="basic" title="Información básica" />
            {openSections.has("basic") && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PLAYER_FIELDS.basic.map(({ key, label, type, options }) => {
                  // For age: compute from born.year if not directly set
                  let displayValue = localPlayer[key];
                  if (key === "age" && !displayValue && localPlayer.born?.year) {
                    displayValue = currentSeason - localPlayer.born.year;
                  }
                  return (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                      {type === "select" && options ? (
                        <select value={localPlayer[key] ?? ""} onChange={e => updateField(key, e.target.value)} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground">
                          {options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <Input type={type} value={displayValue ?? ""} onChange={e => updateField(key, type === "number" ? parseInt(e.target.value) || 0 : e.target.value)} className="bg-muted border-border" />
                      )}
                    </div>
                  );
                })}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Equipo</label>
                  <select value={localPlayer.tid ?? -1} onChange={e => updateField("tid", parseInt(e.target.value))} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground">
                    <option value={-1}>Free Agent</option>
                    <option value={-2}>Retirado</option>
                    {teams.map(t => <option key={t.tid} value={t.tid}>{(t as any).abbrev} — {(t as any).region} {(t as any).name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Contract */}
            <SectionHeader id="contract" title="Contrato" />
            {openSections.has("contract") && (
              <div className="grid grid-cols-2 gap-3">
                {PLAYER_FIELDS.contract.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <Input type="number" value={localPlayer.contract?.[key] ?? ""} onChange={e => updateNestedField(`contract.${key}`, parseInt(e.target.value) || 0)} className="bg-muted border-border" />
                  </div>
                ))}
              </div>
            )}

            {/* Ratings */}
            <SectionHeader id="ratings" title="Ratings" />
            {openSections.has("ratings") && lastRating && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {PLAYER_FIELDS.ratings.map(rf => (
                  <div key={rf}>
                    <label className="text-[10px] text-muted-foreground uppercase block mb-0.5" title={PLAYER_FIELDS.ratingLabels[rf]}>
                      {rf} <span className="text-muted-foreground/50">({PLAYER_FIELDS.ratingLabels[rf]})</span>
                    </label>
                    <Input type="number" min={0} max={100} value={lastRating[rf] ?? 0} onChange={e => updateRatingLocal(rf, parseInt(e.target.value) || 0)} className="bg-muted border-border h-8 text-xs" />
                  </div>
                ))}
              </div>
            )}

            {/* Born */}
            <SectionHeader id="born" title="Nacimiento" />
            {openSections.has("born") && (
              <div className="grid grid-cols-2 gap-3">
                {PLAYER_FIELDS.born.map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <Input type={type} value={localPlayer.born?.[key] ?? ""} onChange={e => updateNestedField(`born.${key}`, type === "number" ? parseInt(e.target.value) || 0 : e.target.value)} className="bg-muted border-border" />
                  </div>
                ))}
                {playerAge !== null && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Edad calculada</label>
                    <div className="bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground">{playerAge} años</div>
                  </div>
                )}
              </div>
            )}

            {/* Draft */}
            <SectionHeader id="draft" title="Draft" />
            {openSections.has("draft") && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PLAYER_FIELDS.draft.map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <Input type={type} value={localPlayer.draft?.[key] ?? ""} onChange={e => updateNestedField(`draft.${key}`, type === "number" ? parseInt(e.target.value) || 0 : e.target.value)} className="bg-muted border-border" />
                  </div>
                ))}
              </div>
            )}

            {/* Injury */}
            <SectionHeader id="injury" title="Lesión" />
            {openSections.has("injury") && (
              <div className="grid grid-cols-2 gap-3">
                {PLAYER_FIELDS.injury.map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <Input type={type} value={localPlayer.injury?.[key] ?? ""} onChange={e => updateNestedField(`injury.${key}`, type === "number" ? parseInt(e.target.value) || 0 : e.target.value)} className="bg-muted border-border" />
                  </div>
                ))}
              </div>
            )}

            {/* Advanced */}
            <SectionHeader id="advanced" title="Avanzado" />
            {openSections.has("advanced") && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PLAYER_FIELDS.advanced.map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    {type === "boolean" ? (
                      <button onClick={() => updateField(key, !localPlayer[key])} className={`w-10 h-5 rounded-full transition-colors ${localPlayer[key] ? "bg-primary" : "bg-muted-foreground/30"}`}>
                        <div className={`w-4 h-4 rounded-full bg-card shadow transition-transform ${localPlayer[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    ) : (
                      <Input type={type} value={localPlayer[key] ?? ""} onChange={e => updateField(key, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)} className="bg-muted border-border" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Awards */}
            <SectionHeader id="awards" title={`Premios (${(localPlayer.awards || []).length})`} />
            {openSections.has("awards") && (
              <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1">
                {(localPlayer.awards || []).map((a: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center text-xs bg-muted rounded p-2">
                    <span className="text-muted-foreground w-12">{a.season}</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{a.type}</span>
                    <span className="text-foreground flex-1">{a.name || a.team || "—"}</span>
                  </div>
                ))}
                {(localPlayer.awards || []).length === 0 && <p className="text-xs text-muted-foreground">Sin premios</p>}
              </div>
            )}

            {/* Mood Traits */}
            <SectionHeader id="mood" title="Mood Traits" />
            {openSections.has("mood") && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Traits (separados por coma: $, L, W, F)</label>
                <Input value={(localPlayer.moodTraits || []).join(", ")} onChange={e => updateField("moodTraits", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} className="bg-muted border-border" />
              </div>
            )}

            {/* Relatives - clean interface instead of raw JSON */}
            <SectionHeader id="relatives" title={`Familiares (${(localPlayer.relatives || []).length})`} />
            {openSections.has("relatives") && (
              <div className="space-y-2">
                {(localPlayer.relatives || []).map((rel: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-muted rounded-lg p-2">
                    <select
                      value={rel.type || "brother"}
                      onChange={e => updateRelative(i, "type", e.target.value)}
                      className="bg-card border border-border rounded-md px-2 py-1 text-xs text-foreground"
                    >
                      <option value="brother">Hermano</option>
                      <option value="son">Hijo</option>
                      <option value="father">Padre</option>
                    </select>
                    <Input
                      value={rel.name || ""}
                      onChange={e => updateRelative(i, "name", e.target.value)}
                      placeholder="Nombre"
                      className="bg-card border-border h-7 text-xs flex-1"
                    />
                    <Input
                      type="number"
                      value={rel.pid ?? ""}
                      onChange={e => updateRelative(i, "pid", parseInt(e.target.value) || 0)}
                      placeholder="PID"
                      className="bg-card border-border h-7 text-xs w-20"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeRelative(i)} className="h-7 w-7 text-destructive shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addRelative} className="gap-1 text-xs">
                  <Plus className="w-3 h-3" /> Añadir Familiar
                </Button>
              </div>
            )}

            {/* Salaries History */}
            <SectionHeader id="salaries" title={`Historial Salarial (${(localPlayer.salaries || []).length})`} />
            {openSections.has("salaries") && (
              <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1">
                {(localPlayer.salaries || []).map((s: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center text-xs">
                    <span className="text-muted-foreground w-12">{s.season}</span>
                    <span className="text-primary font-medium">${(s.amount / 1000).toFixed(1)}M</span>
                  </div>
                ))}
                {(localPlayer.salaries || []).length === 0 && <p className="text-xs text-muted-foreground">Sin historial</p>}
              </div>
            )}

            {/* Injuries History */}
            <SectionHeader id="injuries" title={`Historial Lesiones (${(localPlayer.injuries || []).length})`} />
            {openSections.has("injuries") && (
              <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1">
                {(localPlayer.injuries || []).map((inj: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center text-xs">
                    <span className="text-muted-foreground w-12">{inj.season}</span>
                    <span className="text-foreground">{inj.type}</span>
                    <span className="text-muted-foreground">({inj.games} juegos)</span>
                  </div>
                ))}
                {(localPlayer.injuries || []).length === 0 && <p className="text-xs text-muted-foreground">Sin lesiones</p>}
              </div>
            )}

            {/* Transactions */}
            <SectionHeader id="transactions" title={`Transacciones (${(localPlayer.transactions || []).length})`} />
            {openSections.has("transactions") && (
              <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1">
                {(localPlayer.transactions || []).map((tx: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center text-xs">
                    <span className="text-muted-foreground w-12">{tx.season}</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{tx.type}</span>
                    <span className="text-foreground">→ {teamName(tx.tid)}</span>
                  </div>
                ))}
                {(localPlayer.transactions || []).length === 0 && <p className="text-xs text-muted-foreground">Sin transacciones</p>}
              </div>
            )}

            {/* Stats summary */}
            <SectionHeader id="stats" title={`Stats (${(localPlayer.stats || []).length} temporadas)`} />
            {openSections.has("stats") && (
              <div className="max-h-48 overflow-y-auto scrollbar-thin">
                {(localPlayer.stats || []).length > 0 ? (
                  <table className="w-full text-[10px]">
                    <thead><tr className="text-muted-foreground"><th className="text-left p-1">Temp</th><th className="text-left p-1">Eq</th><th className="text-right p-1">GP</th><th className="text-right p-1">PTS</th><th className="text-right p-1">AST</th><th className="text-right p-1">REB</th><th className="text-right p-1">PER</th></tr></thead>
                    <tbody>
                      {localPlayer.stats.map((s: any, i: number) => (
                        <tr key={i} className="border-t border-border">
                          <td className="p-1">{s.season}{s.playoffs ? " P" : ""}</td>
                          <td className="p-1">{teamName(s.tid)}</td>
                          <td className="p-1 text-right">{s.gp}</td>
                          <td className="p-1 text-right">{s.pts}</td>
                          <td className="p-1 text-right">{s.ast}</td>
                          <td className="p-1 text-right">{(s.orb || 0) + (s.drb || 0)}</td>
                          <td className="p-1 text-right">{(s.per || 0).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-xs text-muted-foreground">Sin stats</p>}
              </div>
            )}

            {/* Custom fields */}
            {customFields.length > 0 && (
              <>
                <SectionHeader id="custom" title={`Campos personalizados (${customFields.length})`} />
                {openSections.has("custom") && (
                  <div className="grid grid-cols-2 gap-3">
                    {customFields.map(key => {
                      const val = localPlayer[key];
                      if (typeof val === "object") return (
                        <div key={key} className="col-span-2">
                          <label className="text-[10px] text-muted-foreground block mb-0.5">{key}</label>
                          <textarea value={JSON.stringify(val, null, 1)} onChange={e => { try { updateField(key, JSON.parse(e.target.value)); } catch {} }} className="w-full bg-muted border border-border rounded-md p-2 text-[10px] font-mono text-foreground h-16 resize-y" />
                        </div>
                      );
                      return (
                        <div key={key}>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">{key}</label>
                          <Input type={typeof val === "number" ? "number" : "text"} value={String(val ?? "")} onChange={e => updateField(key, typeof val === "number" ? parseFloat(e.target.value) || 0 : e.target.value)} className="bg-muted border-border h-8 text-xs" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </EditSheet>
    </div>
  );
};

export default PlayersEditor;
