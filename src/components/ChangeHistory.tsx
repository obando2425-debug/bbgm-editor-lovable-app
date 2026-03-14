import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Clock, Download, ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "players", label: "Jugadores" },
  { key: "teams", label: "Equipos" },
  { key: "gameAttributes", label: "Config" },
  { key: "draftPicks", label: "Draft" },
  { key: "awards", label: "Premios" },
  { key: "events", label: "Eventos" },
];

const ChangeHistory = () => {
  const { changeHistory, undo, redo, undoneChanges, setActiveTab } = useLeague();
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Deduplicate entries with same description within 500ms
  const deduplicated = useMemo(() => {
    const result: typeof changeHistory = [];
    for (const c of changeHistory) {
      const last = result[result.length - 1];
      if (last && last.section === c.section && last.description === c.description && Math.abs(last.timestamp - c.timestamp) < 500) {
        continue;
      }
      result.push(c);
    }
    return result;
  }, [changeHistory]);

  const filtered = useMemo(() => {
    if (filter === "all") return deduplicated;
    return deduplicated.filter(c => c.section === filter);
  }, [deduplicated, filter]);

  const undoAll = () => {
    changeHistory.filter(c => !undoneChanges.has(c.id)).forEach(c => undo(c.id));
    toast.success("Todos los cambios deshechos");
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(changeHistory, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "change-history.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Historial exportado");
  };

  const copyValue = (val: any) => {
    navigator.clipboard.writeText(JSON.stringify(val, null, 2));
    toast.success("Copiado al portapapeles");
  };

  const navigateToSection = (section: string) => {
    const tabMap: Record<string, string> = {
      players: "players", teams: "teams", gameAttributes: "settings",
      draftPicks: "draft", awards: "awards", events: "trades",
    };
    const tab = tabMap[section] || section;
    setActiveTab(tab);
  };

  const formatValue = (val: any, maxLen = 120): string => {
    if (val === undefined || val === null) return "—";
    if (typeof val === "string") return val.length > maxLen ? val.slice(0, maxLen) + "..." : val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return `[${val.length} elementos]`;
    if (typeof val === "object") {
      // Try to get a meaningful summary
      if (val.firstName) return `${val.firstName} ${val.lastName || ""}`;
      if (val.region) return `${val.region} ${val.name || ""}`;
      if (val.key) return `${val.key}: ${formatValue(val.value, 60)}`;
      const keys = Object.keys(val);
      return `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""}}`;
    }
    return String(val);
  };

  const getChangeType = (change: typeof changeHistory[0]): string => {
    const desc = change.description.toLowerCase();
    if (desc.includes("eliminad")) return "eliminación";
    if (desc.includes("cread") || desc.includes("añadid")) return "creación";
    if (desc.includes("actualiz") || desc.includes("modific")) return "edición";
    if (desc.includes("corregid") || desc.includes("corrección")) return "corrección";
    if (desc.includes("propagac")) return "propagación";
    return "edición";
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "eliminación": return "bg-destructive/10 text-destructive";
      case "creación": return "bg-green-500/10 text-green-400";
      case "corrección": return "bg-yellow-500/10 text-yellow-400";
      case "propagación": return "bg-blue-500/10 text-blue-400";
      default: return "bg-primary/10 text-primary";
    }
  };

  if (changeHistory.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground animate-fade-in">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No hay cambios registrados aún.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="text-sm text-muted-foreground">{filtered.length} cambios</div>
        <div className="flex-1" />
        {/* Category filter buttons */}
        <div className="flex gap-1">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                filter === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={undoAll} className="gap-1 text-xs">
          <Undo2 className="w-3 h-3" /> Deshacer todo
        </Button>
        <Button variant="outline" size="sm" onClick={exportHistory} className="gap-1 text-xs">
          <Download className="w-3 h-3" /> Exportar
        </Button>
      </div>
      <div className="space-y-2 max-h-[65vh] overflow-y-auto scrollbar-thin">
        {filtered.map(change => {
          const isUndone = undoneChanges.has(change.id);
          const isExpanded = expandedId === change.id;
          const changeType = getChangeType(change);
          return (
            <div
              key={change.id}
              className={`bg-card border border-border rounded-lg ${isUndone ? "opacity-50" : ""}`}
            >
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : change.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize shrink-0 ${getChangeTypeColor(changeType)}`}>
                    {changeType}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); navigateToSection(change.section); }}
                    className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize shrink-0 hover:bg-primary/20 transition-colors"
                  >
                    {change.section}
                  </button>
                  {change.fieldName && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono shrink-0">
                      {change.fieldName}
                    </span>
                  )}
                  <span className="text-sm text-foreground truncate">{change.description}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                    {new Date(change.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  {!isUndone ? (
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); undo(change.id); }} className="h-7 w-7" title="Deshacer">
                      <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); redo(change.id); }} className="h-7 w-7 text-primary" title="Rehacer">
                      <Redo2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-border space-y-3">
                  {/* Change metadata */}
                  <div className="grid grid-cols-3 gap-3 mt-3 text-[10px]">
                    <div>
                      <span className="text-muted-foreground uppercase block mb-0.5">Tipo</span>
                      <span className={`px-1.5 py-0.5 rounded ${getChangeTypeColor(changeType)}`}>{changeType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase block mb-0.5">Sección</span>
                      <button onClick={() => navigateToSection(change.section)} className="text-primary hover:underline flex items-center gap-1">
                        {change.section} <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase block mb-0.5">Hora</span>
                      <span className="text-foreground">{new Date(change.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Before / After comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">Valor Anterior</span>
                        <button onClick={() => copyValue(change.before)} className="text-muted-foreground hover:text-primary"><Copy className="w-3 h-3" /></button>
                      </div>
                      <pre className="text-[10px] bg-destructive/5 rounded-lg p-2 overflow-auto max-h-32 text-muted-foreground font-mono border border-destructive/10">
                        {formatValue(change.before)}
                      </pre>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">Valor Nuevo</span>
                        <button onClick={() => copyValue(change.after)} className="text-muted-foreground hover:text-primary"><Copy className="w-3 h-3" /></button>
                      </div>
                      <pre className="text-[10px] bg-green-500/5 rounded-lg p-2 overflow-auto max-h-32 text-muted-foreground font-mono border border-green-500/10">
                        {formatValue(change.after)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChangeHistory;
