import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { BBGMLeague } from "@/types/bbgm";

interface LeagueContextType {
  league: BBGMLeague | null;
  setLeague: (league: BBGMLeague | null) => void;
  fileName: string;
  setFileName: (name: string) => void;
  hasChanges: boolean;
  setHasChanges: (v: boolean) => void;
  updatePlayers: (players: BBGMLeague["players"]) => void;
  updateTeams: (teams: BBGMLeague["teams"]) => void;
  updateGameAttributes: (attrs: BBGMLeague["gameAttributes"]) => void;
  updateDraftPicks: (picks: BBGMLeague["draftPicks"]) => void;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export const useLeague = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error("useLeague must be inside LeagueProvider");
  return ctx;
};

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [league, setLeagueState] = useState<BBGMLeague | null>(null);
  const [fileName, setFileName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const setLeague = useCallback((l: BBGMLeague | null) => {
    setLeagueState(l);
    setHasChanges(false);
  }, []);

  const updatePlayers = useCallback((players: BBGMLeague["players"]) => {
    setLeagueState(prev => prev ? { ...prev, players } : prev);
    setHasChanges(true);
  }, []);

  const updateTeams = useCallback((teams: BBGMLeague["teams"]) => {
    setLeagueState(prev => prev ? { ...prev, teams } : prev);
    setHasChanges(true);
  }, []);

  const updateGameAttributes = useCallback((gameAttributes: BBGMLeague["gameAttributes"]) => {
    setLeagueState(prev => prev ? { ...prev, gameAttributes } : prev);
    setHasChanges(true);
  }, []);

  const updateDraftPicks = useCallback((draftPicks: BBGMLeague["draftPicks"]) => {
    setLeagueState(prev => prev ? { ...prev, draftPicks } : prev);
    setHasChanges(true);
  }, []);

  return (
    <LeagueContext.Provider value={{
      league, setLeague, fileName, setFileName,
      hasChanges, setHasChanges,
      updatePlayers, updateTeams, updateGameAttributes, updateDraftPicks,
    }}>
      {children}
    </LeagueContext.Provider>
  );
};
