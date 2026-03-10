import React, { useMemo, useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchResult {
  section: string;
  path: string;
  value: string;
  context: string;
  index?: number;
}

const SECTION_TAB_MAP: Record<string, string> = {
  players: "players",
  teams: "teams",
  draftPicks: "draft",
  awards: "awards",
  events: "trades",
  gameAttributes: "settings",
  coaches: "staff",
};

const GlobalSearch = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { league, setActiveTab } = useLeague();
  const [query, setQuery] = useState("");

  const results = useMemo((): SearchResult[] => {
    if (!league || query.length < 2) return [];
    const q = query.toLowerCase();
    const found: SearchResult[] = [];
    const maxResults = 100;

    const search = (obj: any, section: string, path: string, index?: number) => {
      if (found.length >= maxResults) return;
      if (obj == null) return;
      if (typeof obj === "string" && obj.toLowerCase().includes(q)) {
        found.push({ section, path, value: obj.slice(0, 100), context: path, index });
      } else if (typeof obj === "number" && String(obj).includes(query)) {
        found.push({ section, path, value: String(obj), context: path, index });
      } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => {
          if (found.length >= maxResults) return;
          search(item, section, `${path}[${i}]`, i);
        });
      } else if (typeof obj === "object") {
        Object.entries(obj).forEach(([k, v]) => {
          if (found.length >= maxResults) return;
          if (k.toLowerCase().includes(q)) {
            found.push({ section, path: `${path}.${k}`, value: String(v).slice(0, 80), context: `key: ${k}`, index });
          }
          search(v, section, `${path}.${k}`, index);
        });
      }
    };

    Object.entries(league).forEach(([key, val]) => {
      search(val, key, key);
    });
    return found;
  }, [league, query]);

  const navigateToResult = (result: SearchResult) => {
    const tab = SECTION_TAB_MAP[result.section];
    if (tab) {
      setActiveTab(tab);
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
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar en todo el JSON..."
            className="border-0 bg-transparent focus-visible:ring-0 text-lg"
            autoFocus
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-thin flex-1 p-2">
          {query.length < 2 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Escribe al menos 2 caracteres para buscar
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No se encontraron resultados
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground px-3 py-1">{results.length} resultados</div>
              {results.map((r, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => navigateToResult(r)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{r.section}</span>
                    <span className="text-xs text-muted-foreground font-mono truncate">{r.path}</span>
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
