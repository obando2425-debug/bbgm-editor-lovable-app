import React, { useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Download, Upload, Users, Trophy, Settings, FileText, ListOrdered,
  Sparkles, Search, History, GitCompare, Award, DollarSign, ArrowLeftRight,
  Calendar, Briefcase, ExternalLink, FileJson, X, CheckCircle2, AlertCircle, TrendingUp
} from "lucide-react";
import PlayersEditor from "@/components/PlayersEditor";
import TeamsEditor from "@/components/TeamsEditor";
import GameAttributesEditor from "@/components/GameAttributesEditor";
import DraftEditor from "@/components/DraftEditor";
import CodeEditor from "@/components/CodeEditor";
import AwardsEditor from "@/components/AwardsEditor";
import ContractsEditor from "@/components/ContractsEditor";
import TradeHistoryEditor from "@/components/TradeHistoryEditor";
import SeasonHistoryEditor from "@/components/SeasonHistoryEditor";
import StaffEditor from "@/components/StaffEditor";
import EconomyEditor from "@/components/EconomyEditor";
import ChangeHistory from "@/components/ChangeHistory";
import JsonComparator from "@/components/JsonComparator";
import AIChatPanel from "@/components/AIChatPanel";
import GlobalSearch from "@/components/GlobalSearch";
import { toast } from "sonner";

const EditorDashboard = () => {
  const { league, fileName, hasChanges, setLeague, setFileName, referenceFiles, addReferenceFile, removeReferenceFile, changeHistory } = useLeague();
  const [aiOpen, setAiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleDownload = () => {
    if (!league) return;
    const blob = new Blob([JSON.stringify(league, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName || "bbgm-edited.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Archivo descargado");
  };

  const handleNewFile = () => { setLeague(null); setFileName(""); };

  const handleAddReference = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          addReferenceFile(file.name, data);
          toast.success(`"${file.name}" añadido como referencia`);
        } catch { toast.error("JSON inválido"); }
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  };

  const exportSection = (key: string, data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${key}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${key} exportado`);
  };

  // JSON validator
  const isValid = (() => {
    try { JSON.stringify(league); return true; } catch { return false; }
  })();

  const stats = {
    players: league?.players?.length || 0,
    teams: league?.teams?.length || 0,
    picks: league?.draftPicks?.length || 0,
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-display text-gradient-fire tracking-wider">BBGM EDITOR</h1>
            <span className="hidden sm:inline text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted truncate max-w-[150px]">{fileName}</span>
            {hasChanges && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning text-warning-foreground font-medium">Sin guardar</span>
            )}
            {/* Validator indicator */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${isValid ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {isValid ? "Válido" : "Error"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Global search */}
            <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)} className="gap-1 text-xs" title="Ctrl+K">
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Buscar</span>
              <kbd className="hidden md:inline text-[9px] px-1 py-0.5 rounded bg-muted ml-1">⌘K</kbd>
            </Button>
            {/* AI button */}
            <Button variant={aiOpen ? "default" : "outline"} size="sm" onClick={() => setAiOpen(!aiOpen)} className="gap-1 text-xs">
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">IA</span>
            </Button>
            {/* Add reference file */}
            <label className="cursor-pointer">
              <input type="file" accept=".json" multiple onChange={handleAddReference} className="sr-only" />
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
                <span><FileJson className="w-3.5 h-3.5" /> <span className="hidden md:inline">+Ref</span></span>
              </Button>
            </label>
            <Button variant="outline" size="sm" onClick={handleNewFile} className="gap-1 text-xs">
              <Upload className="w-3.5 h-3.5" /><span className="hidden sm:inline">Nuevo</span>
            </Button>
            <Button size="sm" onClick={handleDownload} className="gap-1 text-xs">
              <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Descargar</span>
            </Button>
            <a href="https://play.basketball-gm.com" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                🏀<span className="hidden lg:inline">BBGM</span><ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Reference files bar */}
      {referenceFiles.length > 0 && (
        <div className="container mx-auto px-4 py-1.5 flex items-center gap-2 text-xs border-b border-border bg-muted/30">
          <span className="text-muted-foreground">Refs:</span>
          {referenceFiles.map(f => (
            <span key={f.id} className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 text-accent">
              {f.name}
              <button onClick={() => removeReferenceFile(f.id)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span><Users className="w-3.5 h-3.5 inline mr-1" />{stats.players} jugadores</span>
          <span><Trophy className="w-3.5 h-3.5 inline mr-1" />{stats.teams} equipos</span>
          <span><ListOrdered className="w-3.5 h-3.5 inline mr-1" />{stats.picks} picks</span>
          <span><History className="w-3.5 h-3.5 inline mr-1" />{changeHistory.length} cambios</span>
        </div>
      </div>

      {/* Editor Tabs */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="players">
          <TabsList className="bg-secondary mb-4 flex-wrap h-auto gap-0.5 p-1">
            <TabsTrigger value="players" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-3 h-3" /> Jugadores
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="w-3 h-3" /> Equipos
            </TabsTrigger>
            <TabsTrigger value="draft" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ListOrdered className="w-3 h-3" /> Draft
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="w-3 h-3" /> Contratos
            </TabsTrigger>
            <TabsTrigger value="awards" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="w-3 h-3" /> Premios
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Briefcase className="w-3 h-3" /> Staff
            </TabsTrigger>
            <TabsTrigger value="trades" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ArrowLeftRight className="w-3 h-3" /> Trades
            </TabsTrigger>
            <TabsTrigger value="seasons" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-3 h-3" /> Historial
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-3 h-3" /> Config
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-3 h-3" /> Code
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GitCompare className="w-3 h-3" /> Comparar
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="w-3 h-3" /> Cambios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players"><PlayersEditor /></TabsContent>
          <TabsContent value="teams"><TeamsEditor /></TabsContent>
          <TabsContent value="draft"><DraftEditor /></TabsContent>
          <TabsContent value="contracts"><ContractsEditor /></TabsContent>
          <TabsContent value="awards"><AwardsEditor /></TabsContent>
          <TabsContent value="staff"><StaffEditor /></TabsContent>
          <TabsContent value="trades"><TradeHistoryEditor /></TabsContent>
          <TabsContent value="seasons"><SeasonHistoryEditor /></TabsContent>
          <TabsContent value="settings"><GameAttributesEditor /></TabsContent>
          <TabsContent value="code"><CodeEditor /></TabsContent>
          <TabsContent value="compare"><JsonComparator /></TabsContent>
          <TabsContent value="history"><ChangeHistory /></TabsContent>
        </Tabs>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default EditorDashboard;
