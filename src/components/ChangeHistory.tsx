import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Clock, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["all", "players", "teams", "gameAttributes", "draftPicks", "awards", "events", "coaches"];

const ChangeHistory = () => {
  const { changeHistory, undo, redo, undoneChanges } = useLeague();
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return changeHistory;
    return changeHistory.filter(c => c.section === filter);
  }, [changeHistory, filter]);

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
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-card border border-border rounded-md px-2 py-1 text-xs text-foreground"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === "all" ? "Todos" : c}</option>
          ))}
        </select>
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
          return (
            <div
              key={change.id}
              className={`bg-card border border-border rounded-lg p-3 ${isUndone ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize shrink-0">
                    {change.section}
                  </span>
                  {change.fieldName && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono shrink-0">
                      {change.fieldName}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(change.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  {!isUndone ? (
                    <Button variant="ghost" size="icon" onClick={() => undo(change.id)} className="h-7 w-7" title="Deshacer">
                      <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => redo(change.id)} className="h-7 w-7 text-primary" title="Rehacer">
                      <Redo2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground mt-1 truncate">{change.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChangeHistory;
