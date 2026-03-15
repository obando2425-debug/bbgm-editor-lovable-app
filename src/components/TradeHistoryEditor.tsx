import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Copy, Plus, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import EditSheet from "@/components/EditSheet";

const TradeHistoryEditor = () => {
  const { league, updateSection, updatePlayers } = useLeague();
  const [search, setSearch] = useState("");
  const [tradeFormOpen, setTradeFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<any>(null);

  // Trade form state
  const [team1Tid, setTeam1Tid] = useState<number>(0);
  const [team2Tid, setTeam2Tid] = useState<number>(1);
  const [team1Players, setTeam1Players] = useState<number[]>([]);
  const [team2Players, setTeam2Players] = useState<number[]>([]);

  const events = league?.events || [];
  const teams = league?.teams || [];
  const players = league?.players || [];

  const trades = useMemo(() => {
    return events
      .map((e: any, i: number) => ({ ...e, _idx: i }))
      .filter((e: any) => e.type === "trade" || (typeof e.text === "string" && e.text.toLowerCase().includes("trade")))
      .filter((e: any) => !search || JSON.stringify(e).toLowerCase().includes(search.toLowerCase()));
  }, [events, search]);

  const deleteTrade = (idx: number) => {
    updateSection("events", events.filter((_: any, i: number) => i !== idx));
    toast.success("Evento eliminado");
  };

  const duplicateTrade = (idx: number) => {
    const updated = [...events];
    updated.splice(idx + 1, 0, { ...events[idx] });
    updateSection("events", updated);
    toast.success("Evento duplicado");
  };

  const teamPlayers = (tid: number) => players.filter((p: any) => p.tid === tid);
  const teamName = (tid: number) => teams.find((t: any) => t.tid === tid);

  const executeTrade = () => {
    if (team1Players.length === 0 && team2Players.length === 0) {
      toast.error("Selecciona al menos un jugador");
      return;
    }
    const updated = [...players];
    team1Players.forEach(pIdx => {
      updated[pIdx] = { ...updated[pIdx], tid: team2Tid };
    });
    team2Players.forEach(pIdx => {
      updated[pIdx] = { ...updated[pIdx], tid: team1Tid };
    });
    updatePlayers(updated);

    // Add trade event
    const t1 = teamName(team1Tid);
    const t2 = teamName(team2Tid);
    const t1Names = team1Players.map(i => `${players[i]?.firstName} ${players[i]?.lastName}`).join(", ");
    const t2Names = team2Players.map(i => `${players[i]?.firstName} ${players[i]?.lastName}`).join(", ");
    const tradeText = `${t1?.abbrev || team1Tid} traded ${t1Names || "nothing"} to ${t2?.abbrev || team2Tid} for ${t2Names || "nothing"}`;
    const season = (league?.gameAttributes as any)?.season || 2025;
    updateSection("events", [...events, { type: "trade", text: tradeText, season, tids: [team1Tid, team2Tid] }]);

    setTeam1Players([]);
    setTeam2Players([]);
    setTradeFormOpen(false);
    toast.success("Trade ejecutado");
  };

  const togglePlayer = (pIdx: number, side: 1 | 2) => {
    const setter = side === 1 ? setTeam1Players : setTeam2Players;
    setter(prev => prev.includes(pIdx) ? prev.filter(i => i !== pIdx) : [...prev, pIdx]);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar trades..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        <Button onClick={() => setTradeFormOpen(true)} className="gap-2">
          <ArrowLeftRight className="w-3.5 h-3.5" /> Crear Trade
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mb-2">{trades.length} trades encontrados</div>

      <div className="space-y-2 max-h-[65vh] overflow-y-auto scrollbar-thin">
        {trades.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            No se encontraron trades en la sección "events".
          </div>
        )}
        {trades.map((trade: any) => (
          <div key={trade._idx} className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setEditingTrade(trade)}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    Season {trade.season ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">{trade.type}</span>
                </div>
                <p className="text-sm text-foreground">{trade.text || JSON.stringify(trade).slice(0, 150)}</p>
              </div>
              <div className="flex gap-1 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={() => duplicateTrade(trade._idx)} className="h-7 w-7">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteTrade(trade._idx)} className="h-7 w-7 text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trade detail sheet */}
      <EditSheet
        open={editingTrade !== null}
        onClose={() => setEditingTrade(null)}
        title="Detalle del Trade"
        onExportJson={() => editingTrade}
        exportFileName="trade.json"
      >
        {editingTrade && (
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto text-muted-foreground">
            {JSON.stringify(editingTrade, (k, v) => k.startsWith("_") ? undefined : v, 2)}
          </pre>
        )}
      </EditSheet>

      {/* Trade Creator Sheet */}
      <EditSheet
        open={tradeFormOpen}
        onClose={() => setTradeFormOpen(false)}
        title="Crear Trade"
        description="Selecciona jugadores de cada equipo para intercambiar"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Team 1 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Equipo 1</label>
              <select value={team1Tid} onChange={e => { setTeam1Tid(Number(e.target.value)); setTeam1Players([]); }} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground mb-2">
                {teams.map((t: any) => <option key={t.tid} value={t.tid}>{t.abbrev} — {t.region} {t.name}</option>)}
              </select>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {teamPlayers(team1Tid).map((p: any) => {
                  const pIdx = players.indexOf(p);
                  const selected = team1Players.includes(pIdx);
                  return (
                    <div key={pIdx} onClick={() => togglePlayer(pIdx, 1)} className={`p-2 rounded text-xs cursor-pointer transition-colors ${selected ? "bg-primary/20 text-primary" : "bg-muted hover:bg-muted/80"}`}>
                      {p.firstName} {p.lastName} <span className="text-muted-foreground">({p.pos})</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Team 2 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Equipo 2</label>
              <select value={team2Tid} onChange={e => { setTeam2Tid(Number(e.target.value)); setTeam2Players([]); }} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground mb-2">
                {teams.map((t: any) => <option key={t.tid} value={t.tid}>{t.abbrev} — {t.region} {t.name}</option>)}
              </select>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {teamPlayers(team2Tid).map((p: any) => {
                  const pIdx = players.indexOf(p);
                  const selected = team2Players.includes(pIdx);
                  return (
                    <div key={pIdx} onClick={() => togglePlayer(pIdx, 2)} className={`p-2 rounded text-xs cursor-pointer transition-colors ${selected ? "bg-primary/20 text-primary" : "bg-muted hover:bg-muted/80"}`}>
                      {p.firstName} {p.lastName} <span className="text-muted-foreground">({p.pos})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card border border-border rounded-lg p-3">
            <h4 className="text-xs font-display tracking-wider text-primary mb-2">RESUMEN</h4>
            <div className="text-sm">
              <span className="font-medium">{teamName(team1Tid)?.abbrev}</span> envía: {team1Players.map(i => `${players[i]?.firstName} ${players[i]?.lastName}`).join(", ") || "nada"}
            </div>
            <div className="text-sm mt-1">
              <span className="font-medium">{teamName(team2Tid)?.abbrev}</span> envía: {team2Players.map(i => `${players[i]?.firstName} ${players[i]?.lastName}`).join(", ") || "nada"}
            </div>
          </div>

          <Button onClick={executeTrade} className="w-full gap-2">
            <ArrowLeftRight className="w-4 h-4" /> Ejecutar Trade
          </Button>
        </div>
      </EditSheet>
    </div>
  );
};

export default TradeHistoryEditor;
