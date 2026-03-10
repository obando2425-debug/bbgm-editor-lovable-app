import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Send, X, Loader2, PanelLeftOpen, PanelLeftClose, Star, StarOff, Trash2, Plus, Paperclip, Link2, MessageSquarePlus, Clock, BookOpen, Brain, FileText as FileTextIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatSession {
  id: string;
  title: string;
  date: number;
  messages: Msg[];
  projectName?: string;
}

const SESSIONS_KEY = "aurora-sessions";
const FAVORITES_KEY = "aurora-favorites";
const MEMORY_KEY = "aurora-memory";
const INSTRUCTIONS_KEY = "aurora-instructions";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bbgm-ai-chat`;

const loadSessions = (): ChatSession[] => {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); } catch { return []; }
};
const saveSessions = (sessions: ChatSession[]) => {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 50))); } catch {}
};
const loadFavorites = (): string[] => {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); } catch { return []; }
};
const saveFavorites = (favs: string[]) => {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); } catch {}
};

const ACTION_REGEX = /<<BBGM_ACTION\s+type="([^"]+)">>([^]*?)<<\/BBGM_ACTION>>/g;
const cleanActionBlocks = (text: string) => text.replace(/<<BBGM_ACTION\s+type="[^"]*">>[^]*?<<\/BBGM_ACTION>>/g, "").replace(/\n{3,}/g, "\n\n").trim();

const DEFAULT_INSTRUCTIONS = `Eres Aurora AI, un asistente experto y editor activo de Basketball GM. Tu trabajo es ayudar al usuario a editar archivos JSON de ligas de BBGM aplicando cambios DIRECTAMENTE usando bloques de acción. Nunca muestres JSON para copiar manualmente. Responde siempre en español.`;

const TEMPLATES = [
  { label: "Actualizar plantillas NBA 2025", prompt: "Actualiza las plantillas de todos los equipos con los rosters reales de la NBA 2025", category: "Plantillas" },
  { label: "Crear jugador ficticio", prompt: "Crea un jugador ficticio con estadísticas coherentes y un backstory interesante", category: "Crear" },
  { label: "Añadir fotos a un equipo", prompt: "Añade URLs de fotos reales a todos los jugadores de los Lakers", category: "Media" },
  { label: "Crear liga de futbolistas", prompt: "Crea 30 jugadores basados en futbolistas famosos con estadísticas de basketball coherentes", category: "Crear" },
  { label: "Equilibrar ratings del equipo", prompt: "Analiza y equilibra los ratings de todos los jugadores del equipo con tid 0 para que sean coherentes", category: "Editar" },
  { label: "Generar clase de draft", prompt: "Genera una clase de draft completa con 30 prospectos variados y realistas para la próxima temporada", category: "Draft" },
  { label: "Crear equipo expansion", prompt: "Crea un equipo de expansión completo con 15 jugadores, coaches y configuración", category: "Crear" },
  { label: "Auditar liga completa", prompt: "Analiza toda la liga y reporta inconsistencias: jugadores sin equipo válido, contratos irregulares, ratings incoherentes", category: "Análisis" },
  { label: "Simular free agency", prompt: "Genera movimientos de free agency realistas: reasigna los agentes libres a equipos que los necesiten", category: "Editar" },
  { label: "Actualizar contratos", prompt: "Actualiza todos los contratos de la liga con valores realistas basados en los ratings de cada jugador", category: "Editar" },
];

const SIDEBAR_TABS = ["history", "favorites", "templates", "memory", "instructions"] as const;
type SidebarTab = typeof SIDEBAR_TABS[number];

const AIChatPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { league, fileName, updatePlayers, updateTeams, updateGameAttributes, updateDraftPicks, updateSection } = useLeague();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("history");
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: any } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [memory, setMemory] = useState(() => { try { return localStorage.getItem(MEMORY_KEY) || ""; } catch { return ""; } });
  const [instructions, setInstructions] = useState(() => { try { return localStorage.getItem(INSTRUCTIONS_KEY) || DEFAULT_INSTRUCTIONS; } catch { return DEFAULT_INSTRUCTIONS; } });
  const [progressInfo, setProgressInfo] = useState<{ text: string; percent: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullTextRef = useRef("");
  const [appliedActions, setAppliedActions] = useState<string[]>([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Save memory/instructions on change
  useEffect(() => { try { localStorage.setItem(MEMORY_KEY, memory); } catch {} }, [memory]);
  useEffect(() => { try { localStorage.setItem(INSTRUCTIONS_KEY, instructions); } catch {} }, [instructions]);

  const getAttr = useCallback((key: string) => {
    const ga = league?.gameAttributes;
    if (Array.isArray(ga)) return (ga as any[]).find((a: any) => a.key === key)?.value;
    return (ga as any)?.[key];
  }, [league]);

  const saveCurrentSession = useCallback((msgs: Msg[]) => {
    if (msgs.length === 0) return;
    const id = currentSessionId || crypto.randomUUID();
    if (!currentSessionId) setCurrentSessionId(id);
    const title = msgs[0]?.content.slice(0, 50) || "Chat";
    const updated = [
      { id, title, date: Date.now(), messages: msgs, projectName: fileName },
      ...sessions.filter(s => s.id !== id),
    ].slice(0, 50);
    setSessions(updated);
    saveSessions(updated);
  }, [currentSessionId, sessions, fileName]);

  const applyAction = useCallback((type: string, data: any) => {
    const players = league?.players || [];
    const teams = league?.teams || [];
    try {
      switch (type) {
        case "create_player": {
          updatePlayers([...players, data]);
          return `Jugador ${data.firstName} ${data.lastName} creado (Total: ${players.length + 1})`;
        }
        case "update_players": {
          const updates = Array.isArray(data) ? data : [data];
          let count = 0;
          const newPlayers = [...players];
          for (const u of updates) {
            const idx = newPlayers.findIndex(p =>
              (p.firstName || "").toLowerCase() === (u.match?.firstName || "").toLowerCase() &&
              (p.lastName || "").toLowerCase() === (u.match?.lastName || "").toLowerCase()
            );
            if (idx !== -1) { newPlayers[idx] = { ...newPlayers[idx], ...u.updates }; count++; }
          }
          if (count > 0) updatePlayers(newPlayers);
          return `${count} jugador(es) actualizado(s)`;
        }
        case "delete_player": {
          const before = players.length;
          const filtered = players.filter(p =>
            !((p.firstName || "").toLowerCase() === (data.firstName || "").toLowerCase() &&
              (p.lastName || "").toLowerCase() === (data.lastName || "").toLowerCase())
          );
          if (filtered.length < before) updatePlayers(filtered);
          return `Jugador ${data.firstName} ${data.lastName} eliminado (Total: ${filtered.length})`;
        }
        case "create_team": {
          updateTeams([...teams, { ...data, tid: data.tid ?? teams.length }]);
          return `Equipo ${data.region} ${data.name} creado (Total: ${teams.length + 1})`;
        }
        case "update_team": {
          const newTeams = teams.map(t => t.tid === data.tid ? { ...t, ...data } : t);
          updateTeams(newTeams);
          return `Equipo tid=${data.tid} actualizado`;
        }
        case "update_game_attributes": {
          const ga = league?.gameAttributes;
          if (Array.isArray(ga)) {
            const updated = [...(ga as any[])];
            for (const [k, v] of Object.entries(data)) {
              const idx = updated.findIndex((a: any) => a.key === k);
              if (idx !== -1) updated[idx] = { ...updated[idx], value: v };
              else updated.push({ key: k, value: v });
            }
            updateGameAttributes(updated as any);
          } else {
            updateGameAttributes({ ...ga, ...data } as any);
          }
          return `Configuración actualizada`;
        }
        case "batch_create_players": {
          const arr = Array.isArray(data) ? data : data.players || [];
          updatePlayers([...players, ...arr]);
          return `${arr.length} jugadores creados (Total: ${players.length + arr.length})`;
        }
        default:
          return `Acción desconocida: ${type}`;
      }
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }, [league, updatePlayers, updateTeams, updateGameAttributes]);

  const parseAndApplyActions = useCallback((text: string) => {
    const results: string[] = [];
    let match;
    const regex = new RegExp(ACTION_REGEX.source, "g");
    while ((match = regex.exec(text)) !== null) {
      try {
        const type = match[1];
        const data = JSON.parse(match[2].trim());
        const result = applyAction(type, data);
        results.push(`✓ ${result}`);
      } catch (e: any) {
        results.push(`✗ Error parsing action: ${e.message}`);
      }
    }
    if (results.length > 0) {
      setAppliedActions(results);
      toast.success(`${results.length} acción(es) aplicada(s) al JSON`);
    }
  }, [applyAction]);

  // Progress detection from streamed text
  const detectProgress = useCallback((text: string) => {
    const progressMatch = text.match(/(?:bloque|batch|lote)\s*(\d+)\s*(?:de|\/)\s*(\d+)/i)
      || text.match(/(\d+)\s*(?:de|\/)\s*(\d+)\s*(?:jugadores?|equipos?|creados?)/i);
    if (progressMatch) {
      const current = parseInt(progressMatch[1]);
      const total = parseInt(progressMatch[2]);
      if (total > 0) {
        setProgressInfo({ text: `${current}/${total}`, percent: Math.round((current / total) * 100) });
      }
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    let content = input.trim();
    if (attachedFile) {
      const summary = JSON.stringify(attachedFile.data).slice(0, 6000);
      content = `[Archivo adjunto: ${attachedFile.name}]\n${summary}\n\n${content}`;
      setAttachedFile(null);
    }
    if (urlValue.trim()) {
      content = `[URL adjunta: ${urlValue.trim()}]\n\n${content}`;
      setUrlValue("");
      setShowUrlInput(false);
    }
    const userMsg: Msg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAppliedActions([]);
    setProgressInfo(null);
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    setIsLoading(true);
    fullTextRef.current = "";

    let assistantSoFar = "";
    const updateAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      fullTextRef.current = assistantSoFar;
      detectProgress(assistantSoFar);
      const clean = cleanActionBlocks(assistantSoFar);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: clean } : m));
        }
        return [...prev, { role: "assistant", content: clean }];
      });
    };

    try {
      const leagueContext = league ? {
        teams: league.teams?.map(t => ({ tid: t.tid, region: (t as any).region, name: (t as any).name, abbrev: (t as any).abbrev })),
        playerCount: league.players?.length,
        teamCount: league.teams?.length,
        season: getAttr("season"),
        leagueName: getAttr("leagueName"),
        salaryCap: getAttr("salaryCap"),
        fileName,
        samplePlayers: league.players?.slice(0, 10).map(p => `${p.firstName} ${p.lastName} (tid:${p.tid}, ovr:${p.ratings?.[p.ratings.length-1]?.ovr})`),
      } : null;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          leagueContext,
          memory: memory || undefined,
          customInstructions: instructions !== DEFAULT_INSTRUCTIONS ? instructions : undefined,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }
      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) updateAssistant(c);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      parseAndApplyActions(fullTextRef.current);
      setProgressInfo(null);

      const finalMessages = [...newMessages, { role: "assistant" as const, content: cleanActionBlocks(fullTextRef.current) }];
      saveCurrentSession(finalMessages);

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error al conectar con Aurora AI");
      updateAssistant("\n\n⚠️ Error: " + (e.message || "No se pudo conectar"));
    } finally {
      setIsLoading(false);
      setProgressInfo(null);
    }
  };

  const toggleFavorite = (prompt: string) => {
    const next = favorites.includes(prompt) ? favorites.filter(f => f !== prompt) : [...favorites, prompt];
    setFavorites(next);
    saveFavorites(next);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setSidebarOpen(false);
  };

  const newChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setAppliedActions([]);
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    saveSessions(updated);
    if (currentSessionId === id) newChat();
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setAttachedFile({ name: file.name, data });
        toast.success(`${file.name} adjuntado`);
      } catch { toast.error("JSON inválido"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const summarizeSession = () => {
    if (messages.length === 0) { toast.error("No hay mensajes en la sesión"); return; }
    const summary = messages.map(m => `[${m.role}]: ${m.content.slice(0, 200)}`).join("\n");
    const timestamp = new Date().toLocaleString();
    setMemory(prev => `${prev}\n\n--- Resumen sesión ${timestamp} ---\n${summary}`.trim());
    toast.success("Sesión resumida y guardada en memoria");
  };

  const cleanOldMemory = (days: number = 7) => {
    const lines = memory.split("\n");
    const now = Date.now();
    const cutoff = now - days * 86400000;
    const filtered = lines.filter(line => {
      const dateMatch = line.match(/--- Resumen sesión (.+) ---/);
      if (dateMatch) {
        try {
          const d = new Date(dateMatch[1]).getTime();
          return d > cutoff;
        } catch { return true; }
      }
      return true;
    });
    setMemory(filtered.join("\n").trim());
    toast.success(`Memoria limpiada (>${days} días)`);
  };

  if (!open) return null;

  const sidebarTabLabels: Record<SidebarTab, { icon: React.ReactNode; label: string }> = {
    history: { icon: <Clock className="w-3.5 h-3.5" />, label: "Historial" },
    favorites: { icon: <Star className="w-3.5 h-3.5" />, label: "Favoritos" },
    templates: { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Plantillas" },
    memory: { icon: <Brain className="w-3.5 h-3.5" />, label: "Memoria" },
    instructions: { icon: <FileTextIcon className="w-3.5 h-3.5" />, label: "Instrucciones" },
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] bg-card border-l border-border z-50 flex shadow-2xl animate-fade-in">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-[220px] border-r border-border bg-secondary/30 flex flex-col shrink-0 overflow-hidden">
          <div className="p-2 border-b border-border">
            <Button variant="ghost" size="sm" onClick={newChat} className="w-full gap-1 text-xs justify-start">
              <MessageSquarePlus className="w-3.5 h-3.5" /> Nuevo chat
            </Button>
          </div>
          {/* Sidebar tabs */}
          <div className="flex border-b border-border">
            {SIDEBAR_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-1.5 text-[10px] transition-colors ${sidebarTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                title={sidebarTabLabels[tab].label}
              >
                <div className="flex justify-center">{sidebarTabLabels[tab].icon}</div>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {sidebarTab === "history" && (
              <div className="p-2">
                {sessions.length === 0 && <p className="text-[10px] text-muted-foreground px-1">Sin chats previos</p>}
                {sessions.map(s => (
                  <div key={s.id} className={`flex items-center gap-1 rounded px-1.5 py-1 text-[11px] cursor-pointer hover:bg-muted/50 group ${currentSessionId === s.id ? "bg-muted" : ""}`}>
                    <button onClick={() => loadSession(s)} className="flex-1 text-left truncate text-foreground">{s.title}</button>
                    <button onClick={() => deleteSession(s.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            {sidebarTab === "favorites" && (
              <div className="p-2">
                {favorites.length === 0 && <p className="text-[10px] text-muted-foreground px-1">Guarda prompts con la estrella</p>}
                {favorites.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] cursor-pointer hover:bg-muted/50 group">
                    <button onClick={() => setInput(f)} className="flex-1 text-left truncate text-foreground">{f}</button>
                    <button onClick={() => toggleFavorite(f)} className="opacity-0 group-hover:opacity-100 text-destructive"><StarOff className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            {sidebarTab === "templates" && (
              <div className="p-2 space-y-1">
                {TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(t.prompt)}
                    className="block w-full text-left rounded border border-border hover:border-primary/50 p-2 transition-colors"
                  >
                    <span className="text-[10px] text-primary font-medium">{t.category}</span>
                    <span className="block text-[11px] text-foreground mt-0.5">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
            {sidebarTab === "memory" && (
              <div className="p-2 space-y-2">
                <textarea
                  value={memory}
                  onChange={e => setMemory(e.target.value)}
                  placeholder="La IA guardará contexto importante aquí. También puedes editarlo manualmente..."
                  className="w-full bg-muted border border-border rounded-md p-2 text-[11px] text-foreground min-h-[200px] resize-y scrollbar-thin"
                />
                <Button variant="outline" size="sm" onClick={summarizeSession} className="w-full text-[10px] gap-1">
                  <Brain className="w-3 h-3" /> Resumir sesión actual
                </Button>
                <Button variant="ghost" size="sm" onClick={() => cleanOldMemory(7)} className="w-full text-[10px] gap-1">
                  <Trash2 className="w-3 h-3" /> Limpiar memoria antigua (7 días)
                </Button>
              </div>
            )}
            {sidebarTab === "instructions" && (
              <div className="p-2 space-y-2">
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  className="w-full bg-muted border border-border rounded-md p-2 text-[11px] text-foreground min-h-[200px] resize-y scrollbar-thin font-mono"
                />
                <Button variant="ghost" size="sm" onClick={() => { setInstructions(DEFAULT_INSTRUCTIONS); toast.success("Instrucciones restablecidas"); }} className="w-full text-[10px] gap-1">
                  <RotateCcw className="w-3 h-3" /> Restablecer por defecto
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/50 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-7 w-7">
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-display text-sm tracking-wider text-primary">AURORA AI</span>
              <span className="text-[10px] text-muted-foreground block">Editor inteligente de BBGM</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar */}
        {progressInfo && (
          <div className="px-3 py-2 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span>{progressInfo.text}</span>
            </div>
            <Progress value={progressInfo.percent} className="h-2" />
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
              <Sparkles className="w-10 h-10 text-primary" />
              <div>
                <p className="font-display text-lg text-primary tracking-wider">Aurora AI</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                  Editor inteligente de BBGM. Puedo crear jugadores, modificar equipos, actualizar datos y más. Los cambios se aplican automáticamente.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2 w-full max-w-[400px]">
                {TEMPLATES.slice(0, 8).map(t => (
                  <button key={t.label} onClick={() => setInput(t.prompt)} className="text-[10px] px-2 py-1.5 rounded border border-border hover:border-primary hover:text-primary transition-colors text-left">
                    <span className="text-primary/70 font-medium">{t.category}</span>
                    <span className="block text-foreground">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                <pre className="whitespace-pre-wrap font-body text-sm break-words">{msg.content}</pre>
                {msg.role === "user" && (
                  <button onClick={() => toggleFavorite(msg.content)} className="mt-1 opacity-50 hover:opacity-100" title="Guardar como favorito">
                    {favorites.includes(msg.content) ? <Star className="w-3 h-3 fill-warning text-warning" /> : <Star className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {appliedActions.length > 0 && (
            <div className="space-y-1">
              {appliedActions.map((a, i) => (
                <div key={i} className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                  {a}
                </div>
              ))}
            </div>
          )}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
            </div>
          )}
        </div>

        {/* Attachments bar */}
        {(attachedFile || showUrlInput) && (
          <div className="px-3 pb-1 flex items-center gap-2 text-xs">
            {attachedFile && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary">
                <Paperclip className="w-3 h-3" /> {attachedFile.name}
                <button onClick={() => setAttachedFile(null)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {showUrlInput && (
              <div className="flex items-center gap-1 flex-1">
                <input value={urlValue} onChange={e => setUrlValue(e.target.value)} placeholder="https://..." className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs text-foreground" />
                <button onClick={() => { setShowUrlInput(false); setUrlValue(""); }}><X className="w-3 h-3 text-muted-foreground" /></button>
              </div>
            )}
          </div>
        )}

        {/* Input - Enter ALWAYS makes newline, only button sends */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex gap-1 shrink-0 pb-1">
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileAttach} className="sr-only" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary transition-colors" title="Adjuntar JSON">
                <Paperclip className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} className="text-muted-foreground hover:text-primary transition-colors" title="Adjuntar URL">
                <Link2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              placeholder="Escribe tu mensaje... (Enter = nueva línea)"
              className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-sm resize-none min-h-[38px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              rows={1}
              disabled={isLoading}
            />
            <Button type="button" size="icon" disabled={isLoading || !input.trim()} className="shrink-0 mb-0.5" onClick={sendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
