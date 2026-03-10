import React from "react";
import { useLeague, LeagueProvider } from "@/context/LeagueContext";
import FileUpload from "@/components/FileUpload";
import EditorDashboard from "@/components/EditorDashboard";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";

const IndexContent = () => {
  const { league, hasSavedSession, sessionChecked, restoreSession, discardSession } = useLeague();

  return (
    <div className={`min-h-screen bg-background bg-court-pattern ${hasSavedSession && !league ? "pt-12" : ""}`}>
      {/* Restore banner */}
      {sessionChecked && hasSavedSession && !league && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary/95 text-primary-foreground px-4 py-3 flex items-center justify-center gap-4 shadow-lg animate-fade-in">
          <span className="text-sm font-medium">Tienes una sesión guardada — ¿Continuar?</span>
          <Button size="sm" variant="secondary" onClick={restoreSession} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Continuar
          </Button>
          <Button size="sm" variant="ghost" onClick={discardSession} className="gap-1.5 text-primary-foreground/80 hover:text-primary-foreground">
            <Trash2 className="w-3.5 h-3.5" /> Descartar
          </Button>
        </div>
      )}
      {!league ? <FileUpload /> : <EditorDashboard />}
    </div>
  );
};

const Index = () => (
  <LeagueProvider>
    <IndexContent />
  </LeagueProvider>
);

export default Index;
