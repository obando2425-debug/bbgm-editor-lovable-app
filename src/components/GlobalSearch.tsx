import React, { useMemo, useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchResult {
  section: string;
  path: string;
  value: string;
  context: string;
  elementName: string; // name of the player/team/element
  fieldLabel: string;  // specific field name
  index?: number;
  playerIdx?: number;
  teamIdx?: number;
}

const SECTION_TAB_MAP: Record<string, string> = {
  players: "players", teams: "teams", draftPicks: "draft",
  awards: "awards", events: "trades", gameAttributes: "settings",
  retiredPlayers: "retired", hallOfFame: "halloffame", messages: "messages",
};

const SECTION_LABELS: Record<string, string> = {
  players: "Jugadores", teams: "Equipos", draftPicks: "Draft",
  awards: "Premios", events: "Eventos", gameAttributes: "Configuración",
  retiredPlayers: "Retirados", hallOfFame: "Hall of Fame", messages: "Mensajes",
};

const GlobalSearch = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { league, setActiveTab } = useLeague();
  const [query, setQuery] = useState("");

  const results = useMemo((): SearchResult[] => {
    if (!league || query.length < 2) return [];
    const q = query.toLowerCase();
    const found: SearchResult[] = [];
    const maxResults = 100;

    // Helper to get element name for context
    const getElementName = (section: string, item: any, index: number): string => {
      if (section === "players" || section === "retiredPlayers" || section === "hallOfFame") {
        return `${item?.firstName || ""} ${item?.lastName || ""}`.trim() || `#${index}`;
      }
      if (section === "teams") {
        return `${item?.region || ""} ${item?.name || ""}`.trim() || `TID ${item?.tid ?? index}`;
      }
      if (section === "draftPicks") return `Pick R${item?.round || "?"}/${item?.season || "?"}`;
      if (section === "awards") return `${item?.type || "Premio"} ${item?.season || ""}`;
      if (section === "events") return `Evento ${item?.type || ""} #${index}`;
      if (section === "messages") return `Mensaje #${index}`;
      return `#${index}`;
    };

    const searchItem = (item: any, section: string, parentPath: string, arrIdx: number, elementName: string) => {
      if (found.length >= maxResults || !item) return;
      if (typeof item === "string" && item.toLowerCase().includes(q)) {
        const fieldLabel = parentPath.split(".").pop() || parentPath;
        found.push({ section, path: parentPath, value: item.slice(0, 100), context: parentPath, elementName, fieldLabel, index: arrIdx,
          playerIdx: (section === "players" || section === "retiredPlayers" || section === "hallOfFame") ? arrIdx : undefined,
          teamIdx: section === "teams" ? arrIdx : undefined,
        });
      } else if (typeof item === "number" && String(item).includes(query)) {
        const fieldLabel = parentPath.split(".").pop() || parentPath;
        found.push({ section, path: parentPath, value: String(item), context: parentPath, elementName, fieldLabel, index: arrIdx,
          playerIdx: (section === "players" || section === "retiredPlayers" || section === "hallOfFame") ? arrIdx : undefined,
          teamIdx: section === "teams" ? arrIdx : undefined,
        });
      } else if (Array.isArray(item)) {
        item.forEach((sub, i) => { if (found.length < maxResults) searchItem(sub, section, `${parentPath}[${i}]`, arrIdx, elementName); });
      } else if (typeof item === "object" && item !== null) {
        Object.entries(item).forEach(([k, v]) => {
          if (found.length >= maxResults) return;
          if (k.toLowerCase().includes(q)) {
            found.push({ section, path: `${parentPath}.${k}`, value: String(v).slice(0, 80), context: `key: ${k}`, elementName, fieldLabel: k, index: arrIdx,
              playerIdx: (section === "players" || section === "retiredPlayers" || section === "hallOfFame") ? arrIdx : undefined,
              teamIdx: section === "teams" ? arrIdx : undefined,
            });
          }
          searchItem(v, section, `${parentPath}.${k}`, arrIdx, elementName);
        });
      }
    };

    Object.entries(league).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((item, i) => {
          if (found.length >= maxResults) return;
          const elemName = getElementName(key, item, i);
          searchItem(item, key, `${key}[${i}]`, i, elemName);
        });
      } else if (typeof val === "object" && val !== null) {
        searchItem(val, key, key, 0, key);
      }
    });
    return found;
  }, [league, query]);

  const navigateToResult = (result: SearchResult) => {
    const tab = SECTION_TAB_MAP[result.section];
    if (tab) setActiveTab(tab);
    if (result.playerIdx !== undefined) {
      setTimeout(() => window.dispatchEvent(new CustomEvent("bbgm-open-player", { detail: { index: result.playerIdx } })), 100);
    } else if (result.teamIdx !== undefined) {
      setTimeout(() => window.dispatchEvent(new CustomEvent("bbgm-open-team", { detail: { index: result.teamIdx } })), 100);
    }
    onClose();
    setQuery("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar en todo el JSON..." className="border-0 bg-transparent focus-visible:ring-0 text-lg" autoFocus />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto scrollbar-thin flex-1 p-2">
          {query.length < 2 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Escribe al menos 2 caracteres para buscar</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No se encontraron resultados</div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground px-3 py-1">{results.length} resultados</div>
              {results.map((r, i) => (
                <div key={i} className="px-3 py-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => navigateToResult(r)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{SECTION_LABELS[r.section] || r.section}</span>
                    <span className="text-xs font-medium text-foreground">{r.elementName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{r.fieldLabel}</span>
                  </div>
                  <div className="text-sm text-foreground mt-0.5 truncate">{r.value}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
