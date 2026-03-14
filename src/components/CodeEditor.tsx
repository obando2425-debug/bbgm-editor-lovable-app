import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const SECTIONS = [
  { key: "all", label: "Todo" },
  { key: "players", label: "Jugadores" },
  { key: "teams", label: "Equipos" },
  { key: "gameAttributes", label: "Config" },
  { key: "draftPicks", label: "Draft" },
  { key: "awards", label: "Premios" },
  { key: "events", label: "Eventos" },
  { key: "trade", label: "Trades" },
];

// Simple syntax highlighting for JSON
const highlightJSON = (json: string): React.ReactNode[] => {
  const lines = json.split("\n");
  return lines.map((line, i) => {
    // Tokenize the line for coloring
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Match key (quoted string followed by colon)
      const keyMatch = remaining.match(/^(\s*)"([^"]*)"(\s*:\s*)/);
      if (keyMatch) {
        parts.push(<span key={`${i}-s-${keyIdx}`}>{keyMatch[1]}</span>);
        parts.push(<span key={`${i}-k-${keyIdx}`} className="text-blue-400">"{keyMatch[2]}"</span>);
        parts.push(<span key={`${i}-c-${keyIdx}`} className="text-muted-foreground">{keyMatch[3]}</span>);
        remaining = remaining.slice(keyMatch[0].length);
        keyIdx++;
        continue;
      }
      // Match string value
      const strMatch = remaining.match(/^"([^"]*)"/);
      if (strMatch) {
        parts.push(<span key={`${i}-v-${keyIdx}`} className="text-green-400">"{strMatch[1]}"</span>);
        remaining = remaining.slice(strMatch[0].length);
        keyIdx++;
        continue;
      }
      // Match number
      const numMatch = remaining.match(/^(-?\d+\.?\d*)/);
      if (numMatch) {
        parts.push(<span key={`${i}-n-${keyIdx}`} className="text-amber-400">{numMatch[1]}</span>);
        remaining = remaining.slice(numMatch[0].length);
        keyIdx++;
        continue;
      }
      // Match boolean/null
      const boolMatch = remaining.match(/^(true|false|null)/);
      if (boolMatch) {
        parts.push(<span key={`${i}-b-${keyIdx}`} className="text-purple-400">{boolMatch[1]}</span>);
        remaining = remaining.slice(boolMatch[0].length);
        keyIdx++;
        continue;
      }
      // Brackets/braces
      const bracketMatch = remaining.match(/^([\[\]{}])/);
      if (bracketMatch) {
        parts.push(<span key={`${i}-br-${keyIdx}`} className="text-muted-foreground/70">{bracketMatch[1]}</span>);
        remaining = remaining.slice(1);
        keyIdx++;
        continue;
      }
      // Everything else (whitespace, commas, etc.)
      parts.push(<span key={`${i}-o-${keyIdx}`}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
      keyIdx++;
    }

    return (
      <div key={i} className="flex">
        <span className="text-muted-foreground/30 select-none w-12 text-right pr-3 shrink-0 text-[10px] leading-[1.4rem]">{i + 1}</span>
        <span className="flex-1 leading-[1.4rem]">{parts}</span>
      </div>
    );
  });
};

const CodeEditor = () => {
  const { league, setLeague, setHasChanges, referenceFiles } = useLeague();
  const [activeSection, setActiveSection] = useState("all");
  const [activeRefIdx, setActiveRefIdx] = useState(0);
  const [error, setError] = useState("");
  const [editText, setEditText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIdx, setCurrentSearchIdx] = useState(0);
  const [showHighlighted, setShowHighlighted] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  const currentData = useMemo(() => {
    if (!league) return "";
    if (activeSection === "all") return JSON.stringify(league, null, 2);
    return JSON.stringify(league[activeSection] ?? null, null, 2);
  }, [league, activeSection]);

  useEffect(() => {
    setEditText(currentData);
    setError("");
  }, [activeSection, league]);

  const handleChange = useCallback((val: string) => {
    setEditText(val);
    try {
      const parsed = JSON.parse(val);
      if (activeSection === "all") {
        setLeague(parsed);
      } else {
        setLeague({ ...league!, [activeSection]: parsed });
      }
      setHasChanges(true);
      setError("");
    } catch (e: any) {
      setError(e.message || "JSON inválido");
    }
  }, [activeSection, league, setLeague, setHasChanges]);

  // Search within CODE
  const doSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const lines = editText.split("\n");
    const results: number[] = [];
    const q = query.toLowerCase();
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(q)) results.push(i);
    });
    setSearchResults(results);
    setCurrentSearchIdx(0);
    // Scroll to first result
    if (results.length > 0 && textareaRef.current) {
      const lineHeight = 20;
      textareaRef.current.scrollTop = results[0] * lineHeight;
    }
  }, [editText]);

  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    const next = (currentSearchIdx + 1) % searchResults.length;
    setCurrentSearchIdx(next);
    if (textareaRef.current) {
      textareaRef.current.scrollTop = searchResults[next] * 20;
    }
  };

  const refData = useMemo(() => {
    if (referenceFiles.length === 0) return null;
    const ref = referenceFiles[activeRefIdx]?.data;
    if (!ref) return null;
    if (activeSection === "all") return JSON.stringify(ref, null, 2);
    return JSON.stringify(ref[activeSection] ?? null, null, 2);
  }, [referenceFiles, activeRefIdx, activeSection]);

  const lineCount = (text: string) => text.split("\n").length;

  // Sync scroll between textarea and highlighted view
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightedRef.current) {
      highlightedRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightedRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {SECTIONS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSection === s.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            <span className="mr-1 opacity-50">({i})</span>{s.label}
          </button>
        ))}
      </div>

      {/* Reference file tabs */}
      {referenceFiles.length > 0 && (
        <div className="flex gap-1 mb-3">
          <span className="text-xs text-muted-foreground self-center mr-2">Ref:</span>
          {referenceFiles.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setActiveRefIdx(i)}
              className={`text-xs px-2 py-1 rounded-md ${
                activeRefIdx === i ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar en CODE..."
            value={searchQuery}
            onChange={e => doSearch(e.target.value)}
            className="pl-9 bg-card border-border h-8 text-xs"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{currentSearchIdx + 1}/{searchResults.length}</span>
            <Button variant="outline" size="sm" onClick={nextSearchResult} className="h-8 text-xs px-2">Siguiente</Button>
          </div>
        )}
        <Button
          variant={showHighlighted ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHighlighted(!showHighlighted)}
          className="h-8 text-xs px-2"
          title="Resaltado de sintaxis"
        >
          Color
        </Button>
      </div>

      {/* Validator */}
      <div className={`text-xs px-3 py-1.5 rounded-md mb-3 ${
        error ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-400"
      }`}>
        {error ? `❌ Error: ${error}` : `✅ JSON válido · ${lineCount(editText)} líneas`}
      </div>

      {/* Editor panels */}
      <div className={`grid gap-3 ${refData ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {refData && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex justify-between">
              <span>📖 Referencia (solo lectura)</span>
              <span>{lineCount(refData)} líneas</span>
            </div>
            <textarea
              value={refData}
              readOnly
              className="w-full h-[60vh] bg-muted/50 border border-border rounded-lg p-3 text-xs font-mono text-muted-foreground resize-none scrollbar-thin focus:outline-none"
              spellCheck={false}
            />
          </div>
        )}
        <div>
          <div className="text-xs text-muted-foreground mb-1 flex justify-between">
            <span>✏️ Editor</span>
            <span>{lineCount(editText)} líneas</span>
          </div>
          <div className="relative">
            {showHighlighted && editText.length < 500000 ? (
              <>
                {/* Highlighted overlay */}
                <div
                  ref={highlightedRef}
                  className="absolute inset-0 w-full h-[60vh] bg-card border border-border rounded-lg p-3 text-xs font-mono overflow-auto scrollbar-thin pointer-events-none z-0"
                >
                  {highlightJSON(editText)}
                </div>
                {/* Transparent textarea on top for editing */}
                <textarea
                  ref={textareaRef}
                  value={editText}
                  onChange={e => handleChange(e.target.value)}
                  onScroll={handleScroll}
                  className="w-full h-[60vh] bg-transparent border border-border rounded-lg p-3 pl-[3.75rem] text-xs font-mono text-transparent caret-foreground resize-none scrollbar-thin focus:outline-none focus:ring-2 focus:ring-ring relative z-10"
                  spellCheck={false}
                />
              </>
            ) : (
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={e => handleChange(e.target.value)}
                className="w-full h-[60vh] bg-card border border-border rounded-lg p-3 text-xs font-mono text-foreground resize-none scrollbar-thin focus:outline-none focus:ring-2 focus:ring-ring"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
