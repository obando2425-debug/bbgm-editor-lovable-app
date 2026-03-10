import React, { useState } from "react";
import { useLeague } from "@/context/LeagueContext";

const RawJsonEditor = () => {
  const { league, setLeague, setHasChanges } = useLeague();
  const [error, setError] = useState("");
  const [text, setText] = useState(() => JSON.stringify(league, null, 2));

  const handleChange = (val: string) => {
    setText(val);
    try {
      const parsed = JSON.parse(val);
      setLeague(parsed);
      setHasChanges(true);
      setError("");
    } catch (e) {
      setError("JSON inválido");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-xl tracking-wider text-primary uppercase">JSON Raw</h3>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
      <textarea
        value={text}
        onChange={e => handleChange(e.target.value)}
        className="w-full h-[65vh] bg-card border border-border rounded-lg p-4 text-xs font-mono text-foreground resize-none scrollbar-thin focus:outline-none focus:ring-2 focus:ring-ring"
        spellCheck={false}
      />
    </div>
  );
};

export default RawJsonEditor;
