import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Copy, Plus } from "lucide-react";
import { toast } from "sonner";

const TradeHistoryEditor = () => {
  const { league, updateSection } = useLeague();
  const [search, setSearch] = useState("");

  const events = league?.events || [];
  const trades = useMemo(() => {
    return events
      .map((e: any, i: number) => ({ ...e, _idx: i }))
      .filter((e: any) => e.type === "trade" || (typeof e.text === "string" && e.text.toLowerCase().includes("trade")))
      .filter((e: any) => !search || JSON.stringify(e).toLowerCase().includes(search.toLowerCase()));
  }, [events, search]);

  const deleteTrade = (idx: number) => {
    const updated = events.filter((_: any, i: number) => i !== idx);
    updateSection("events", updated);
    toast.success("Evento eliminado");
  };

  const duplicateTrade = (idx: number) => {
    const updated = [...events];
    updated.splice(idx + 1, 0, { ...events[idx] });
    updateSection("events", updated);
    toast.success("Evento duplicado");
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar trades..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">{trades.length} trades encontrados</div>

      <div className="space-y-2 max-h-[65vh] overflow-y-auto scrollbar-thin">
        {trades.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            No se encontraron trades. La sección "events" puede no existir en este archivo.
          </div>
        )}
        {trades.map((trade: any) => (
          <div key={trade._idx} className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
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
              <div className="flex gap-1 ml-2 shrink-0">
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
    </div>
  );
};

export default TradeHistoryEditor;
