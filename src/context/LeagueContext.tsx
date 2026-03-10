import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import type { BBGMLeague } from "@/types/bbgm";

export interface ChangeRecord {
  id: string;
  timestamp: number;
  section: string;
  description: string;
  before: any;
  after: any;
}

export interface ReferenceFile {
  id: string;
  name: string;
  data: BBGMLeague;
}

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
  updateSection: (key: string, data: any) => void;
  // Multi-JSON
  referenceFiles: ReferenceFile[];
  addReferenceFile: (name: string, data: BBGMLeague) => void;
  removeReferenceFile: (id: string) => void;
  // Change history
  changeHistory: ChangeRecord[];
  addChange: (section: string, description: string, before: any, after: any) => void;
  undo: (changeId: string) => void;
  redo: (changeId: string) => void;
  undoneChanges: Set<string>;
  // Global search
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
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
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>([]);
  const [undoneChanges, setUndoneChanges] = useState<Set<string>>(new Set());
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  const setLeague = useCallback((l: BBGMLeague | null) => {
    setLeagueState(l);
    setHasChanges(false);
    if (!l) {
      setChangeHistory([]);
      setUndoneChanges(new Set());
    }
  }, []);

  const addChange = useCallback((section: string, description: string, before: any, after: any) => {
    const record: ChangeRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      section,
      description,
      before,
      after,
    };
    setChangeHistory(prev => [record, ...prev]);
  }, []);

  const updatePlayers = useCallback((players: BBGMLeague["players"]) => {
    setLeagueState(prev => {
      if (!prev) return prev;
      addChange("players", `Jugadores actualizados`, prev.players, players);
      return { ...prev, players };
    });
    setHasChanges(true);
  }, [addChange]);

  const updateTeams = useCallback((teams: BBGMLeague["teams"]) => {
    setLeagueState(prev => {
      if (!prev) return prev;
      addChange("teams", `Equipos actualizados`, prev.teams, teams);
      return { ...prev, teams };
    });
    setHasChanges(true);
  }, [addChange]);

  const updateGameAttributes = useCallback((gameAttributes: BBGMLeague["gameAttributes"]) => {
    setLeagueState(prev => {
      if (!prev) return prev;
      addChange("gameAttributes", `Configuración actualizada`, prev.gameAttributes, gameAttributes);
      return { ...prev, gameAttributes };
    });
    setHasChanges(true);
  }, [addChange]);

  const updateDraftPicks = useCallback((draftPicks: BBGMLeague["draftPicks"]) => {
    setLeagueState(prev => {
      if (!prev) return prev;
      addChange("draftPicks", `Draft picks actualizados`, prev.draftPicks, draftPicks);
      return { ...prev, draftPicks };
    });
    setHasChanges(true);
  }, [addChange]);

  const updateSection = useCallback((key: string, data: any) => {
    setLeagueState(prev => {
      if (!prev) return prev;
      addChange(key, `${key} actualizado`, prev[key], data);
      return { ...prev, [key]: data };
    });
    setHasChanges(true);
  }, [addChange]);

  const addReferenceFile = useCallback((name: string, data: BBGMLeague) => {
    setReferenceFiles(prev => [...prev, { id: crypto.randomUUID(), name, data }]);
  }, []);

  const removeReferenceFile = useCallback((id: string) => {
    setReferenceFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const undo = useCallback((changeId: string) => {
    const change = changeHistory.find(c => c.id === changeId);
    if (!change) return;
    setLeagueState(prev => {
      if (!prev) return prev;
      return { ...prev, [change.section]: change.before };
    });
    setUndoneChanges(prev => new Set(prev).add(changeId));
    setHasChanges(true);
  }, [changeHistory]);

  const redo = useCallback((changeId: string) => {
    const change = changeHistory.find(c => c.id === changeId);
    if (!change) return;
    setLeagueState(prev => {
      if (!prev) return prev;
      return { ...prev, [change.section]: change.after };
    });
    setUndoneChanges(prev => {
      const next = new Set(prev);
      next.delete(changeId);
      return next;
    });
    setHasChanges(true);
  }, [changeHistory]);

  return (
    <LeagueContext.Provider value={{
      league, setLeague, fileName, setFileName,
      hasChanges, setHasChanges,
      updatePlayers, updateTeams, updateGameAttributes, updateDraftPicks, updateSection,
      referenceFiles, addReferenceFile, removeReferenceFile,
      changeHistory, addChange, undo, redo, undoneChanges,
      globalSearchQuery, setGlobalSearchQuery,
    }}>
      {children}
    </LeagueContext.Provider>
  );
};
