import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, X, Loader2, PanelLeftOpen, PanelLeftClose, Star, StarOff, Trash2, Plus, Paperclip, Link2, MessageSquarePlus } from "lucide-react";
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

const TEMPLATES = [
  { label: "Actualizar plantillas NBA 2025", prompt: "Actualiza las plantillas de todos los equipos con los rosters reales de la NBA 2025" },
  { label: "Crear jugador ficticio", prompt: "Crea un jugador ficticio con estadísticas coherentes" },
  { label: "Añadir fotos a un equipo", prompt: "Añade URLs de fotos reales a todos los jugadores de los Lakers" },
  { label: "Crear liga de futbolistas", prompt: "Crea 30 jugadores basados en futbolistas famosos con estadísticas de basketball coherentes" },
];

const AIChatPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { league, fileName, updatePlayers, updateTeams, updateGameAttributes, updateDraftPicks, updateSection } = useLeague();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: any } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullTextRef = useRef("");
  const [appliedActions, setAppliedActions] = useState<string[]>([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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
          return `Jugador ${data.firstName} ${data.lastName} creado`;
        }
        case "update_players": {
          const updates = Array.isArray(data) ? data : [data];
          let count = 0;
          const newPlayers = [...players];
          for (const u of updates) {
            const idx = newPlayers.findIndex(p =>
              p.firstName.toLowerCase() === u.match?.firstName?.toLowerCase() &&
              p.lastName.toLowerCase() === u.match?.lastName?.toLowerCase()
            );
            if (idx !== -1) { newPlayers[idx] = { ...newPlayers[idx], ...u.updates }; count++; }
          }
          if (count > 0) updatePlayers(newPlayers);
          return `${count} jugador(es) actualizado(s)`;
        }
        case "delete_player": {
          const before = players.length;
          const filtered = players.filter(p =>
            !(p.firstName.toLowerCase() === data.firstName?.toLowerCase() &&
              p.lastName.toLowerCase() === data.lastName?.toLowerCase())
          );
          if (filtered.length < before) updatePlayers(filtered);
          return `Jugador ${data.firstName} ${data.lastName} eliminado`;
        }
        case "create_team": {
          updateTeams([...teams, { ...data, tid: data.tid ?? teams.length }]);
          return `Equipo ${data.region} ${data.name} creado`;
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
          return `${arr.length} jugadores creados`;
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
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    setIsLoading(true);
    fullTextRef.current = "";

    let assistantSoFar = "";
    const updateAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      fullTextRef.current = assistantSoFar;
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
        teams: league.teams?.map(t => ({ tid: t.tid, region: t.region, name: t.name, abbrev: t.abbrev })),
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
        body: JSON.stringify({ messages: newMessages, leagueContext }),
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

      // Apply actions after stream completes
      parseAndApplyActions(fullTextRef.current);

      // Save session
      const finalMessages = [...newMessages, { role: "assistant" as const, content: cleanActionBlocks(fullTextRef.current) }];
      saveCurrentSession(finalMessages);

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error al conectar con Aurora AI");
      updateAssistant("\n\n⚠️ Error: " + (e.message || "No se pudo conectar"));
    } finally {
      setIsLoading(false);
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

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] bg-card border-l border-border z-50 flex shadow-2xl animate-fade-in">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-[200px] border-r border-border bg-secondary/30 flex flex-col shrink-0 overflow-hidden">
          <div className="p-2 border-b border-border">
            <Button variant="ghost" size="sm" onClick={newChat} className="w-full gap-1 text-xs justify-start">
              <MessageSquarePlus className="w-3.5 h-3.5" /> Nuevo chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* History */}
            <div className="p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 px-1">Historial</p>
              {sessions.length === 0 && <p className="text-[10px] text-muted-foreground px-1">Sin chats previos</p>}
              {sessions.map(s => (
                <div key={s.id} className={`flex items-center gap-1 rounded px-1.5 py-1 text-[11px] cursor-pointer hover:bg-muted/50 group ${currentSessionId === s.id ? "bg-muted" : ""}`}>
                  <button onClick={() => loadSession(s)} className="flex-1 text-left truncate text-foreground">{s.title}</button>
                  <button onClick={() => deleteSession(s.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            {/* Favorites */}
            <div className="p-2 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 px-1">⭐ Favoritos</p>
              {favorites.length === 0 && <p className="text-[10px] text-muted-foreground px-1">Guarda prompts con ⭐</p>}
              {favorites.map((f, i) => (
                <div key={i} className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] cursor-pointer hover:bg-muted/50 group">
                  <button onClick={() => setInput(f)} className="flex-1 text-left truncate text-foreground">{f}</button>
                  <button onClick={() => toggleFavorite(f)} className="opacity-0 group-hover:opacity-100 text-warning"><StarOff className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            {/* Templates */}
            <div className="p-2 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 px-1">📋 Plantillas</p>
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => setInput(t.prompt)} className="block w-full text-left text-[11px] px-1.5 py-1 rounded hover:bg-muted/50 truncate text-foreground">
                  {t.label}
                </button>
              ))}
            </div>
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

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
              <Sparkles className="w-10 h-10 text-primary" />
              <div>
                <p className="font-display text-lg text-primary tracking-wider">¡Hola!</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                  Soy Aurora AI. Puedo editar tu liga directamente — crear jugadores, modificar equipos, actualizar datos y mucho más. Los cambios se aplican automáticamente al JSON.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TEMPLATES.slice(0, 3).map(t => (
                  <button key={t.label} onClick={() => setInput(t.prompt)} className="text-[10px] px-2 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors">
                    {t.label}
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
          {/* Applied actions indicator */}
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
                📎 {attachedFile.name}
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

        {/* Input */}
        <div className="p-3 border-t border-border shrink-0">
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2 items-end">
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
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Pregúntale algo a Aurora... (Shift+Enter = nueva línea)"
              className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-sm resize-none min-h-[38px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              rows={1}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0 mb-0.5">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
