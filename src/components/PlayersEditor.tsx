import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Save, Trash2 } from "lucide-react";
import type { BBGMPlayer } from "@/types/bbgm";
import { toast } from "sonner";

const PlayersEditor = () => {
  const { league, updatePlayers } = useLeague();
  const [search, setSearch] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const players = league?.players || [];

  const filtered = useMemo(() => {
    if (!search) return players.map((p, i) => ({ ...p, _idx: i }));
    const q = search.toLowerCase();
    return players
      .map((p, i) => ({ ...p, _idx: i }))
      .filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.pos || "").toLowerCase().includes(q) ||
        String(p.tid).includes(q)
      );
  }, [players, search]);

  const teamName = (tid: number) => {
    if (tid === -1) return "FA";
    if (tid === -2) return "Retired";
    const team = league?.teams?.find(t => t.tid === tid);
    return team ? team.abbrev : `T${tid}`;
  };

  const updatePlayer = (idx: number, field: string, value: any) => {
    const updated = [...players];
    updated[idx] = { ...updated[idx], [field]: value };
    updatePlayers(updated);
  };

  const updateRating = (playerIdx: number, ratingField: string, value: number) => {
    const updated = [...players];
    const p = { ...updated[playerIdx] };
    if (p.ratings && p.ratings.length > 0) {
      const lastRating = { ...p.ratings[p.ratings.length - 1] };
      lastRating[ratingField] = value;
      p.ratings = [...p.ratings.slice(0, -1), lastRating];
    }
    updated[playerIdx] = p;
    updatePlayers(updated);
  };

  const deletePlayer = (idx: number) => {
    const updated = players.filter((_, i) => i !== idx);
    updatePlayers(updated);
    setEditingIdx(null);
    toast.success("Jugador eliminado");
  };

  const addPlayer = () => {
    const newPlayer: BBGMPlayer = {
      firstName: "Nuevo",
      lastName: "Jugador",
      pos: "PG",
      tid: -1,
      age: 22,
      hgt: 75,
      weight: 190,
      born: { year: 2004, loc: "" },
      ratings: [{ ovr: 50, pot: 60, hgt: 50, stre: 50, spd: 50, jmp: 50, endu: 50, ins: 50, dnk: 50, ft: 50, fg: 50, tp: 50, oiq: 50, diq: 50, drb: 50, pss: 50, reb: 50 }],
      contract: { amount: 1000, exp: 2025 },
    };
    updatePlayers([...players, newPlayer]);
    setEditingIdx(players.length);
    toast.success("Jugador añadido");
  };

  const ratingFields = ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "oiq", "diq", "drb", "pss", "reb"];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jugador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Button onClick={addPlayer} className="gap-2">
          + Añadir Jugador
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mb-2">{filtered.length} jugadores</div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary text-secondary-foreground">
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium">Pos</th>
                <th className="text-left p-3 font-medium">Equipo</th>
                <th className="text-left p-3 font-medium">Edad</th>
                <th className="text-left p-3 font-medium">OVR</th>
                <th className="text-left p-3 font-medium">POT</th>
                <th className="text-left p-3 font-medium">Contrato</th>
                <th className="p-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(player => {
                const idx = player._idx;
                const isEditing = editingIdx === idx;
                const lastRating = player.ratings?.[player.ratings.length - 1];
                return (
                  <React.Fragment key={idx}>
                    <tr
                      className={`border-t border-border hover:bg-muted/50 cursor-pointer transition-colors ${isEditing ? "bg-muted/70" : ""}`}
                      onClick={() => setEditingIdx(isEditing ? null : idx)}
                    >
                      <td className="p-3 font-medium">
                        {player.firstName} {player.lastName}
                      </td>
                      <td className="p-3 text-muted-foreground">{player.pos || "—"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                          {teamName(player.tid ?? -1)}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{player.age ?? "—"}</td>
                      <td className="p-3 font-medium">{lastRating?.ovr ?? "—"}</td>
                      <td className="p-3 text-primary font-medium">{lastRating?.pot ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">
                        {player.contract ? `$${((player.contract.amount ?? 0) / 1000).toFixed(1)}M` : "—"}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); deletePlayer(idx); }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="bg-card">
                        <td colSpan={8} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                              <Input value={player.firstName} onChange={e => updatePlayer(idx, "firstName", e.target.value)} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Apellido</label>
                              <Input value={player.lastName} onChange={e => updatePlayer(idx, "lastName", e.target.value)} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Posición</label>
                              <Input value={player.pos || ""} onChange={e => updatePlayer(idx, "pos", e.target.value)} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Team ID</label>
                              <Input type="number" value={player.tid ?? -1} onChange={e => updatePlayer(idx, "tid", parseInt(e.target.value))} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Edad</label>
                              <Input type="number" value={player.age ?? ""} onChange={e => updatePlayer(idx, "age", parseInt(e.target.value))} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Altura (in)</label>
                              <Input type="number" value={player.hgt ?? ""} onChange={e => updatePlayer(idx, "hgt", parseInt(e.target.value))} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Peso (lbs)</label>
                              <Input type="number" value={player.weight ?? ""} onChange={e => updatePlayer(idx, "weight", parseInt(e.target.value))} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Jersey #</label>
                              <Input value={player.jerseyNumber ?? ""} onChange={e => updatePlayer(idx, "jerseyNumber", e.target.value)} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Contrato ($K)</label>
                              <Input type="number" value={player.contract?.amount ?? ""} onChange={e => updatePlayer(idx, "contract", { ...player.contract, amount: parseInt(e.target.value) })} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Contrato Exp</label>
                              <Input type="number" value={player.contract?.exp ?? ""} onChange={e => updatePlayer(idx, "contract", { ...player.contract, exp: parseInt(e.target.value) })} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">College</label>
                              <Input value={player.college ?? ""} onChange={e => updatePlayer(idx, "college", e.target.value)} className="bg-muted border-border" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Img URL</label>
                              <Input value={player.imgURL ?? ""} onChange={e => updatePlayer(idx, "imgURL", e.target.value)} className="bg-muted border-border" />
                            </div>
                          </div>
                          {lastRating && (
                            <>
                              <h4 className="text-xs font-display tracking-wider text-primary mb-2 uppercase">Ratings</h4>
                              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
                                {ratingFields.map(rf => (
                                  <div key={rf}>
                                    <label className="text-[10px] text-muted-foreground uppercase block mb-0.5">{rf}</label>
                                    <Input
                                      type="number"
                                      min={0} max={100}
                                      value={lastRating[rf] ?? 0}
                                      onChange={e => updateRating(idx, rf, parseInt(e.target.value) || 0)}
                                      className="bg-muted border-border h-8 text-xs"
                                    />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
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

export default PlayersEditor;
