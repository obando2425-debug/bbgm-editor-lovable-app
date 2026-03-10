import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Search, Trophy, Award, TrendingUp } from "lucide-react";
import EditSheet from "@/components/EditSheet";

const SeasonHistoryEditor = () => {
  const { league } = useLeague();
  const [search, setSearch] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  const events = league?.events || [];
  const awards = league?.awards || [];
  const teams = league?.teams || [];

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

  // Extract champions, MVPs per season from awards
  const seasonAwards = useMemo(() => {
    const byseason: Record<number, any> = {};
    awards.forEach((a: any) => {
      if (a.season == null) return;
      if (!byseason[a.season]) byseason[a.season] = {};
      // Awards can be structured differently
      if (a.mvp) byseason[a.season].mvp = a.mvp;
      if (a.finals_mvp || a.finalsMvp) byseason[a.season].finalsMvp = a.finals_mvp || a.finalsMvp;
      if (a.dpoy) byseason[a.season].dpoy = a.dpoy;
      if (a.roy) byseason[a.season].roy = a.roy;
      if (a.smoy || a.smoy) byseason[a.season].smoy = a.smoy;
      if (a.mip) byseason[a.season].mip = a.mip;
      // Check for type-based awards
      if (a.type === "mvp") byseason[a.season].mvp = a;
      if (a.type === "champion") byseason[a.season].champion = a;
    });
    return byseason;
  }, [awards]);

  const seasons = useMemo(() => {
    const allSeasons = new Set([
      ...Object.keys(seasonEvents).map(Number),
      ...Object.keys(seasonAwards).map(Number),
    ]);
    return Array.from(allSeasons).sort((a, b) => b - a);
  }, [seasonEvents, seasonAwards]);

  const filteredSeasons = useMemo(() => {
    if (!search) return seasons;
    return seasons.filter(s => String(s).includes(search));
  }, [seasons, search]);

  const selectedEvents = selectedSeason ? seasonEvents[selectedSeason] || [] : [];
  const selectedAwardsData = selectedSeason ? seasonAwards[selectedSeason] || {} : {};

  const formatAwardee = (a: any) => {
    if (!a) return "—";
    if (typeof a === "string") return a;
    if (a.name) return a.name;
    if (a.firstName) return `${a.firstName} ${a.lastName || ""}`;
    return JSON.stringify(a).slice(0, 60);
  };

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
          No hay historial de temporadas.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto scrollbar-thin">
        {filteredSeasons.map(season => {
          const sa = seasonAwards[season] || {};
          const eventCount = seasonEvents[season]?.length || 0;
          return (
            <div key={season} className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedSeason(season)}>
              <h4 className="font-display text-lg text-primary tracking-wider mb-2">
                <Trophy className="w-4 h-4 inline mr-2" />
                {season}
              </h4>
              {sa.mvp && (
                <div className="text-xs text-foreground mb-1">
                  <Award className="w-3 h-3 inline mr-1 text-primary" />
                  MVP: <span className="font-medium">{formatAwardee(sa.mvp)}</span>
                </div>
              )}
              {sa.champion && (
                <div className="text-xs text-foreground mb-1">
                  <Trophy className="w-3 h-3 inline mr-1 text-primary" />
                  Campeón: <span className="font-medium">{formatAwardee(sa.champion)}</span>
                </div>
              )}
              {sa.finalsMvp && (
                <div className="text-xs text-foreground mb-1">
                  Finals MVP: <span className="font-medium">{formatAwardee(sa.finalsMvp)}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                {eventCount} eventos
              </div>
            </div>
          );
        })}
      </div>

      {/* Season Detail Sheet */}
      <EditSheet
        open={selectedSeason !== null}
        onClose={() => setSelectedSeason(null)}
        title={`Temporada ${selectedSeason}`}
        description={`${selectedEvents.length} eventos`}
        onExportJson={() => ({ season: selectedSeason, events: selectedEvents, awards: selectedAwardsData })}
        exportFileName={`season-${selectedSeason}.json`}
      >
        <div className="space-y-4">
          {/* Awards summary */}
          {Object.keys(selectedAwardsData).length > 0 && (
            <div>
              <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Premios</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedAwardsData).map(([key, val]: [string, any]) => (
                  <div key={key} className="bg-muted rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground uppercase mb-1">{key}</div>
                    <div className="text-sm font-medium">{formatAwardee(val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          <div>
            <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Eventos ({selectedEvents.length})</h4>
            <div className="space-y-1">
              {selectedEvents.map((e: any, i: number) => (
                <div key={i} className="text-xs text-foreground/80 py-2 px-3 bg-muted rounded border-b border-border/50">
                  <span className="text-primary/70 mr-2 font-medium">{e.type}</span>
                  {e.text?.slice(0, 200) || JSON.stringify(e).slice(0, 200)}
                </div>
              ))}
              {selectedEvents.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">Sin eventos para esta temporada</div>
              )}
            </div>
          </div>
        </div>
      </EditSheet>
    </div>
  );
};

export default SeasonHistoryEditor;
