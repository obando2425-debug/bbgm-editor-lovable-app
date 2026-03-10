import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const SeasonHistoryEditor = () => {
  const { league } = useLeague();
  const [search, setSearch] = useState("");

  // BBGM stores season history in playoffSeries, allStars, events, etc.
  const events = league?.events || [];
  const allStars = league?.allStars || [];
  const playoffSeries = league?.playoffSeries || [];

  const seasonEvents = useMemo(() => {
    const byseason: Record<number, any[]> = {};
    events.forEach((e: any) => {
      const s = e.season;
      if (s != null) {
        if (!byseason[s]) byseason[s] = [];
        byseason[s].push(e);
      }
    });
    return byseason;
  }, [events]);

  const seasons = useMemo(() => {
    return Object.keys(seasonEvents).map(Number).sort((a, b) => b - a);
  }, [seasonEvents]);

  const filteredSeasons = useMemo(() => {
    if (!search) return seasons;
    return seasons.filter(s => String(s).includes(search));
  }, [seasons, search]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar temporada..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
      </div>

      {filteredSeasons.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No hay historial de temporadas. La sección "events" puede no existir.
        </div>
      )}

      <div className="space-y-3 max-h-[65vh] overflow-y-auto scrollbar-thin">
        {filteredSeasons.map(season => (
          <div key={season} className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-display text-lg text-primary tracking-wider mb-2">TEMPORADA {season}</h4>
            <div className="text-sm text-muted-foreground mb-2">
              {seasonEvents[season]?.length || 0} eventos
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
              {seasonEvents[season]?.slice(0, 10).map((e: any, i: number) => (
                <div key={i} className="text-xs text-foreground/80 py-1 border-b border-border/50 last:border-0">
                  <span className="text-primary/70 mr-2">{e.type}</span>
                  {e.text?.slice(0, 120) || JSON.stringify(e).slice(0, 120)}
                </div>
              ))}
              {(seasonEvents[season]?.length || 0) > 10 && (
                <div className="text-xs text-muted-foreground pt-1">
                  +{seasonEvents[season].length - 10} más...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeasonHistoryEditor;
