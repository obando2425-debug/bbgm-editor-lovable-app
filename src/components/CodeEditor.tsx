import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
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

const CodeEditor = () => {
  const { league, setLeague, setHasChanges, referenceFiles } = useLeague();
  const [activeSection, setActiveSection] = useState("all");
  const [activeRefIdx, setActiveRefIdx] = useState(0);
  const [error, setError] = useState("");
  const [editText, setEditText] = useState("");

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

  const refData = useMemo(() => {
    if (referenceFiles.length === 0) return null;
    const ref = referenceFiles[activeRefIdx]?.data;
    if (!ref) return null;
    if (activeSection === "all") return JSON.stringify(ref, null, 2);
    return JSON.stringify(ref[activeSection] ?? null, null, 2);
  }, [referenceFiles, activeRefIdx, activeSection]);

  const lineCount = (text: string) => text.split("\n").length;

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

      {/* Validator */}
      <div className={`text-xs px-3 py-1.5 rounded-md mb-3 ${
        error ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
      }`}>
        {error ? `❌ Error: ${error}` : "✅ JSON válido"}
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
          <textarea
            value={editText}
            onChange={e => handleChange(e.target.value)}
            className="w-full h-[60vh] bg-card border border-border rounded-lg p-3 text-xs font-mono text-foreground resize-none scrollbar-thin focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
