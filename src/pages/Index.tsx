import React from "react";
import { useLeague } from "@/context/LeagueContext";
import { LeagueProvider } from "@/context/LeagueContext";
import FileUpload from "@/components/FileUpload";
import EditorDashboard from "@/components/EditorDashboard";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";

const RestoreBanner = () => {
  const { hasSavedSession, restoreSession, discardSession, sessionChecked } = useLeague();
  if (!sessionChecked || !hasSavedSession) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary/95 text-primary-foreground px-4 py-3 flex items-center justify-center gap-4 shadow-lg animate-fade-in">
      <span className="text-sm font-medium">Tienes una sesión guardada — ¿Continuar?</span>
      <Button size="sm" variant="secondary" onClick={restoreSession} className="gap-1.5">
        <RotateCcw className="w-3.5 h-3.5" /> Continuar
      </Button>
      <Button size="sm" variant="ghost" onClick={discardSession} className="gap-1.5 text-primary-foreground/80 hover:text-primary-foreground">
        <Trash2 className="w-3.5 h-3.5" /> Descartar
      </Button>
    </div>
  );
};

const IndexContent = () => {
  const { league, hasSavedSession } = useLeague();
  return (
    <div className={`min-h-screen bg-background bg-court-pattern ${hasSavedSession ? "pt-12" : ""}`}>
      <RestoreBanner />
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
