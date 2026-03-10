import React from "react";
import { useLeague } from "@/context/LeagueContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Upload, Users, Trophy, Settings, FileText, ListOrdered } from "lucide-react";
import PlayersEditor from "@/components/PlayersEditor";
import TeamsEditor from "@/components/TeamsEditor";
import GameAttributesEditor from "@/components/GameAttributesEditor";
import DraftEditor from "@/components/DraftEditor";
import RawJsonEditor from "@/components/RawJsonEditor";
import { toast } from "sonner";

const EditorDashboard = () => {
  const { league, fileName, hasChanges, setLeague, setFileName } = useLeague();

  const handleDownload = () => {
    if (!league) return;
    const blob = new Blob([JSON.stringify(league, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "bbgm-edited.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Archivo descargado");
  };

  const handleNewFile = () => {
    setLeague(null);
    setFileName("");
  };

  const stats = {
    players: league?.players?.length || 0,
    teams: league?.teams?.length || 0,
    picks: league?.draftPicks?.length || 0,
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-display text-gradient-fire tracking-wider">BBGM EDITOR</h1>
            <span className="hidden sm:inline text-xs text-muted-foreground px-2 py-1 rounded bg-muted truncate max-w-[200px]">
              {fileName}
            </span>
            {hasChanges && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning text-warning-foreground font-medium">
                Sin guardar
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleNewFile} className="gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
            <Button size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar JSON</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            <Users className="w-4 h-4 inline mr-1" />{stats.players} jugadores
          </span>
          <span className="text-muted-foreground">
            <Trophy className="w-4 h-4 inline mr-1" />{stats.teams} equipos
          </span>
          <span className="text-muted-foreground">
            <ListOrdered className="w-4 h-4 inline mr-1" />{stats.picks} picks
          </span>
        </div>
      </div>

      {/* Editor Tabs */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="players">
          <TabsList className="bg-secondary mb-4 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="players" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-3.5 h-3.5" /> Jugadores
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="w-3.5 h-3.5" /> Equipos
            </TabsTrigger>
            <TabsTrigger value="draft" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ListOrdered className="w-3.5 h-3.5" /> Draft
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-3.5 h-3.5" /> Config
            </TabsTrigger>
            <TabsTrigger value="raw" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-3.5 h-3.5" /> Raw JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players"><PlayersEditor /></TabsContent>
          <TabsContent value="teams"><TeamsEditor /></TabsContent>
          <TabsContent value="draft"><DraftEditor /></TabsContent>
          <TabsContent value="settings"><GameAttributesEditor /></TabsContent>
          <TabsContent value="raw"><RawJsonEditor /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EditorDashboard;
