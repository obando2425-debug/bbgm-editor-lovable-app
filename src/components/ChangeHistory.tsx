import React from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Clock } from "lucide-react";

const ChangeHistory = () => {
  const { changeHistory, undo, redo, undoneChanges } = useLeague();

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
      <div className="text-sm text-muted-foreground mb-3">{changeHistory.length} cambios registrados</div>
      <div className="space-y-2 max-h-[65vh] overflow-y-auto scrollbar-thin">
        {changeHistory.map(change => {
          const isUndone = undoneChanges.has(change.id);
          return (
            <div
              key={change.id}
              className={`bg-card border border-border rounded-lg p-3 flex items-center justify-between ${isUndone ? "opacity-50" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize">
                    {change.section}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(change.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-1 truncate">{change.description}</p>
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
          );
        })}
      </div>
    </div>
  );
};

export default ChangeHistory;
