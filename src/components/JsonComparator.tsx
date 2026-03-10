import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const JsonComparator = () => {
  const { league, referenceFiles } = useLeague();
  const [compareIdx, setCompareIdx] = useState(0);
  const [uploadedJson, setUploadedJson] = useState<any>(null);
  const [uploadedName, setUploadedName] = useState("");

  const compareTarget = uploadedJson || referenceFiles[compareIdx]?.data;
  const compareName = uploadedName || referenceFiles[compareIdx]?.name || "Referencia";

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setUploadedJson(data);
        setUploadedName(file.name);
        toast.success("Archivo cargado para comparar");
      } catch {
        toast.error("JSON inválido");
      }
    };
    reader.readAsText(file);
  };

  const diffs = useMemo(() => {
    if (!league || !compareTarget) return [];
    const result: { key: string; inA: boolean; inB: boolean; sameSize: boolean; sizeA: number; sizeB: number }[] = [];
    const allKeys = new Set([...Object.keys(league), ...Object.keys(compareTarget)]);
    allKeys.forEach(key => {
      const inA = key in league;
      const inB = key in compareTarget;
      const valA = (league as any)[key];
      const valB = (compareTarget as any)[key];
      const sizeA = Array.isArray(valA) ? valA.length : (typeof valA === "object" && valA ? Object.keys(valA).length : (valA != null ? 1 : 0));
      const sizeB = Array.isArray(valB) ? valB.length : (typeof valB === "object" && valB ? Object.keys(valB).length : (valB != null ? 1 : 0));
      result.push({ key, inA, inB, sameSize: sizeA === sizeB, sizeA, sizeB });
    });
    return result.sort((a, b) => {
      if (a.sameSize !== b.sameSize) return a.sameSize ? 1 : -1;
      return a.key.localeCompare(b.key);
    });
  }, [league, compareTarget]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-sm text-muted-foreground">Comparar con:</span>
        {referenceFiles.map((f, i) => (
          <button
            key={f.id}
            onClick={() => { setCompareIdx(i); setUploadedJson(null); }}
            className={`text-xs px-2 py-1 rounded-md ${
              !uploadedJson && compareIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f.name}
          </button>
        ))}
        <label className="text-xs px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-muted cursor-pointer flex items-center gap-1">
          <Upload className="w-3 h-3" /> Subir otro
          <input type="file" accept=".json" onChange={handleUpload} className="sr-only" />
        </label>
      </div>

      {!compareTarget ? (
        <div className="text-center p-8 text-muted-foreground">
          Sube un archivo de referencia o usa el botón "Subir otro" para comparar.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary-foreground">
                <th className="text-left p-3 font-medium">Sección</th>
                <th className="text-left p-3 font-medium">Tu archivo</th>
                <th className="text-left p-3 font-medium">{compareName}</th>
                <th className="text-left p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map(d => (
                <tr key={d.key} className={`border-t border-border ${!d.sameSize ? "bg-warning/5" : ""}`}>
                  <td className="p-3 font-mono text-xs">{d.key}</td>
                  <td className="p-3 text-xs">{d.inA ? `${d.sizeA} items` : <span className="text-destructive">—</span>}</td>
                  <td className="p-3 text-xs">{d.inB ? `${d.sizeB} items` : <span className="text-destructive">—</span>}</td>
                  <td className="p-3">
                    {!d.inA && d.inB && <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">Solo en ref</span>}
                    {d.inA && !d.inB && <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning">Solo en tuyo</span>}
                    {d.inA && d.inB && d.sameSize && <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success">Igual</span>}
                    {d.inA && d.inB && !d.sameSize && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">Diferente</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JsonComparator;
