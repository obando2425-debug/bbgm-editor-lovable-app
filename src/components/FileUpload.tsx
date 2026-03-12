import React, { useCallback, useState } from "react";
import { Upload, FileJson, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { mergeWithSchema, validateBBGMFile } from "@/lib/bbgm-merge";
import { validateLeague } from "@/lib/bbgm-validator";
import { addNotification } from "@/lib/bbgm-notifications";
import { createSnapshot } from "@/lib/bbgm-snapshots";

// Minimal demo league
const DEMO_LEAGUE = {
  version: 37, startingSeason: 2025,
  gameAttributes: {
    season: 2025, startingSeason: 2025, leagueName: "Demo League", numGames: 82,
    salaryCap: 90000, minPayroll: 60000, luxuryPayroll: 100000, luxuryTax: 1.5,
    minContract: 750, maxContract: 30000, numPlayoffByes: 0,
    confs: [{ cid: 0, name: "Eastern" }, { cid: 1, name: "Western" }],
    divs: [
      { did: 0, cid: 0, name: "Atlantic" }, { did: 1, cid: 0, name: "Central" },
      { did: 2, cid: 0, name: "Southeast" }, { did: 3, cid: 1, name: "Northwest" },
      { did: 4, cid: 1, name: "Pacific" }, { did: 5, cid: 1, name: "Southwest" },
    ],
  },
  teams: [
    { tid: 0, cid: 0, did: 0, region: "Boston", name: "Celtics", abbrev: "BOS", pop: 4.7, colors: ["#007A33", "#BA9653", "#FFFFFF"] },
    { tid: 1, cid: 0, did: 0, region: "New York", name: "Knicks", abbrev: "NYK", pop: 8.3, colors: ["#006BB6", "#F58426", "#BEC0C2"] },
    { tid: 2, cid: 1, did: 4, region: "Los Angeles", name: "Lakers", abbrev: "LAL", pop: 3.9, colors: ["#552583", "#FDB927", "#000000"] },
    { tid: 3, cid: 1, did: 5, region: "Dallas", name: "Mavericks", abbrev: "DAL", pop: 1.3, colors: ["#00538C", "#002B5E", "#B8C4CA"] },
    { tid: 4, cid: 0, did: 2, region: "Miami", name: "Heat", abbrev: "MIA", pop: 4.5, colors: ["#98002E", "#F9A01B", "#000000"] },
    { tid: 5, cid: 1, did: 3, region: "Denver", name: "Nuggets", abbrev: "DEN", pop: 2.9, colors: ["#0E2240", "#FEC524", "#8B2131"] },
  ],
  players: [
    { firstName: "Jayson", lastName: "Tatum", pos: "SF", tid: 0, age: 27, hgt: 80, weight: 210, born: { year: 1998, loc: "St. Louis, MO" }, college: "Duke", jerseyNumber: "0", contract: { amount: 31000, exp: 2028 }, ratings: [{ season: 2025, ovr: 89, pot: 92, hgt: 70, stre: 55, spd: 65, jmp: 60, endu: 75, ins: 65, dnk: 80, ft: 75, fg: 82, tp: 78, oiq: 85, diq: 70, drb: 80, pss: 60, reb: 65 }] },
    { firstName: "Luka", lastName: "Doncic", pos: "PG", tid: 3, age: 26, hgt: 79, weight: 230, born: { year: 1999, loc: "Ljubljana, Slovenia" }, college: "", jerseyNumber: "77", contract: { amount: 36000, exp: 2029 }, ratings: [{ season: 2025, ovr: 91, pot: 95, hgt: 60, stre: 55, spd: 55, jmp: 50, endu: 70, ins: 65, dnk: 65, ft: 72, fg: 80, tp: 78, oiq: 95, diq: 50, drb: 90, pss: 92, reb: 65 }] },
    { firstName: "Nikola", lastName: "Jokic", pos: "C", tid: 5, age: 30, hgt: 83, weight: 284, born: { year: 1995, loc: "Sombor, Serbia" }, college: "", jerseyNumber: "15", contract: { amount: 51000, exp: 2028 }, ratings: [{ season: 2025, ovr: 95, pot: 95, hgt: 85, stre: 75, spd: 35, jmp: 30, endu: 80, ins: 95, dnk: 45, ft: 85, fg: 80, tp: 60, oiq: 98, diq: 55, drb: 60, pss: 95, reb: 92 }] },
  ],
  draftPicks: [
    { round: 1, tid: 0, originalTid: 0, season: 2025 },
    { round: 2, tid: 0, originalTid: 0, season: 2025 },
  ],
  awards: [],
};

const FileUpload = () => {
  const { setLeague, setFileName, league, addReferenceFile } = useLeague();
  const [multiMode, setMultiMode] = useState(false);
  const [mergeReport, setMergeReport] = useState<string[] | null>(null);

  const processAndLoad = useCallback((data: any, fileName: string) => {
    try {
      // Step 0: Validate
      const validation = validateBBGMFile(data);
      if (!validation.valid) {
        toast.error(validation.error || "Archivo no válido");
        addNotification({ type: "error", title: "Archivo rechazado", message: validation.error || "No es un JSON de BBGM" });
        return;
      }

      // Step 1-3: Merge with schema
      let result: ReturnType<typeof mergeWithSchema>;
      try {
        result = mergeWithSchema(data);
      } catch (mergeErr) {
        console.error("Merge error:", mergeErr);
        // Fallback: use data as-is without merge
        result = { data, completedFields: [], isValid: true };
        toast.warning("Merge con esquema omitido — se cargó el archivo sin completar campos");
      }
      
      // Step 4: Report completed fields
      if (result.completedFields.length > 0) {
        const report = result.completedFields.slice(0, 20);
        setMergeReport(report);
        addNotification({
          type: "info",
          title: "Merge completado",
          message: `${result.completedFields.length} campos completados automáticamente: ${report.slice(0, 5).join(", ")}${result.completedFields.length > 5 ? "..." : ""}`,
        });
        toast.success(`${result.completedFields.length} campos completados automáticamente`);
      }

      // Validate after merge (non-critical — wrapped in try-catch)
      try {
        const issues = validateLeague(result.data, true);
        const autoFixed = issues.filter(i => i.autoFixed);
        if (autoFixed.length > 0) {
          addNotification({
            type: "warning",
            title: "Correcciones automáticas",
            message: `${autoFixed.length} valores corregidos automáticamente`,
          });
        }
      } catch (valErr) {
        console.error("Validation error (non-critical):", valErr);
      }

      // Create initial snapshot (non-critical)
      try {
        createSnapshot(result.data, `Carga inicial: ${fileName}`);
      } catch (snapErr) {
        console.error("Snapshot error (non-critical):", snapErr);
      }

      setLeague(result.data);
      setFileName(fileName);
      toast.success(`"${fileName}" cargado correctamente (${(result.data.players || []).length} jugadores, ${(result.data.teams || []).length} equipos)`);
    } catch (err) {
      console.error("processAndLoad critical error:", err);
      toast.error(`Error al procesar "${fileName}": ${err instanceof Error ? err.message : "Error desconocido"}`);
      addNotification({ type: "error", title: "Error al cargar", message: `${fileName}: ${err instanceof Error ? err.message : "Error desconocido"}` });
    }
  }, [setLeague, setFileName]);

  const handleFile = useCallback((file: File, asReference: boolean = false) => {
    if (!file.name.endsWith(".json")) {
      toast.error("Solo se aceptan archivos JSON");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (asReference) {
          addReferenceFile(file.name, data);
          toast.success(`"${file.name}" añadido como referencia`);
        } else {
          processAndLoad(data, file.name);
        }
      } catch {
        toast.error("Error al leer el archivo JSON");
      }
    };
    reader.readAsText(file);
  }, [processAndLoad, addReferenceFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 1 && !league) {
      handleFile(files[0]);
    } else if (files.length === 1) {
      handleFile(files[0], multiMode);
    } else {
      files.forEach((f, i) => handleFile(f, i > 0));
    }
  }, [handleFile, league, multiMode]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 1 && !league) {
      handleFile(files[0]);
    } else {
      files.forEach((f, i) => handleFile(f, i > 0 || (league !== null)));
    }
  }, [handleFile, league]);

  const loadDemo = () => {
    processAndLoad(DEMO_LEAGUE as any, "demo-league.json");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-6xl md:text-8xl font-display text-gradient-fire tracking-wider mb-2">BBGM EDITOR</h1>
        <p className="text-muted-foreground text-lg">Edita tu archivo de Basketball GM de forma visual</p>
      </div>

      <label
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative flex flex-col items-center justify-center w-full max-w-lg h-64 rounded-xl border-2 border-dashed border-primary/40 bg-card hover:border-primary hover:glow-orange transition-all duration-300 cursor-pointer group"
      >
        <input type="file" accept=".json" multiple onChange={handleChange} className="sr-only" />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium text-lg">Arrastra tus archivos JSON aquí</p>
            <p className="text-muted-foreground text-sm mt-1">o haz clic para seleccionar (múltiples archivos soportados)</p>
          </div>
          <span className="text-xs text-muted-foreground/60">El primero será editable, el resto como referencia</span>
        </div>
      </label>

      {mergeReport && (
        <div className="mt-4 w-full max-w-lg bg-card border border-border rounded-lg p-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-foreground">Campos completados automáticamente:</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5 ml-6">
            {mergeReport.map((f, i) => <li key={i}>• {f}</li>)}
          </ul>
          <button onClick={() => setMergeReport(null)} className="text-xs text-primary mt-2">Cerrar</button>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button onClick={loadDemo} variant="outline" className="gap-2">
          <FileJson className="w-4 h-4" /> Cargar Demo
        </Button>
        <a href="https://play.basketball-gm.com" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" className="gap-2">Abrir Basketball GM</Button>
        </a>
      </div>
    </div>
  );
};

export default FileUpload;
