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
import SectionInfo from "@/components/SectionInfo";
import { toast } from "sonner";

const EditorDashboard = () => {
  const { league, fileName, hasChanges, setLeague, setFileName, referenceFiles, addReferenceFile, removeReferenceFile, changeHistory, activeTab, setActiveTab } = useLeague();
  const [aiOpen, setAiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-display text-gradient-fire tracking-wider">BBGM EDITOR</h1>
            <span className="hidden sm:inline text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted truncate max-w-[150px]">{fileName}</span>
            {hasChanges && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning text-warning-foreground font-medium">Sin guardar</span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${isValid ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {isValid ? "Válido" : "Error"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)} className="gap-1 text-xs" title="Ctrl+K">
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Buscar</span>
              <kbd className="hidden md:inline text-[9px] px-1 py-0.5 rounded bg-muted ml-1">⌘K</kbd>
            </Button>
            <Button variant={aiOpen ? "default" : "outline"} size="sm" onClick={() => setAiOpen(!aiOpen)} className="gap-1 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aurora</span>
            </Button>
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

      <div className="container mx-auto px-4 py-2">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span><Users className="w-3.5 h-3.5 inline mr-1" />{stats.players} jugadores</span>
          <span><Trophy className="w-3.5 h-3.5 inline mr-1" />{stats.teams} equipos</span>
          <span><ListOrdered className="w-3.5 h-3.5 inline mr-1" />{stats.picks} picks</span>
          <span><History className="w-3.5 h-3.5 inline mr-1" />{changeHistory.length} cambios</span>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <TabsTrigger value="finances" className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="w-3 h-3" /> Finanzas
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

          <TabsContent value="players"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Jugadores</h3><SectionInfo section="players" /></div><PlayersEditor /></TabsContent>
          <TabsContent value="teams"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Equipos</h3><SectionInfo section="teams" /></div><TeamsEditor /></TabsContent>
          <TabsContent value="draft"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Draft</h3><SectionInfo section="draft" /></div><DraftEditor /></TabsContent>
          <TabsContent value="contracts"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Contratos</h3><SectionInfo section="contracts" /></div><ContractsEditor /></TabsContent>
          <TabsContent value="awards"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Premios</h3><SectionInfo section="awards" /></div><AwardsEditor /></TabsContent>
          <TabsContent value="staff"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Staff</h3><SectionInfo section="staff" /></div><StaffEditor /></TabsContent>
          <TabsContent value="trades"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Trades</h3><SectionInfo section="trades" /></div><TradeHistoryEditor /></TabsContent>
          <TabsContent value="seasons"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Historial</h3><SectionInfo section="seasons" /></div><SeasonHistoryEditor /></TabsContent>
          <TabsContent value="settings"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Configuración</h3><SectionInfo section="settings" /></div><GameAttributesEditor /></TabsContent>
          <TabsContent value="finances"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Finanzas de Liga</h3><SectionInfo section="finances" /></div><EconomyEditor /></TabsContent>
          <TabsContent value="code"><CodeEditor /></TabsContent>
          <TabsContent value="compare"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Comparar</h3><SectionInfo section="compare" /></div><JsonComparator /></TabsContent>
          <TabsContent value="history"><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-xl tracking-wider text-primary uppercase">Cambios</h3><SectionInfo section="history" /></div><ChangeHistory /></TabsContent>
        </Tabs>
      </div>

      <AIChatPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default EditorDashboard;
