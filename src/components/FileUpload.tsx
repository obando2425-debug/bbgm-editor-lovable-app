import React, { useCallback, useState } from "react";
import { Upload, Plus, FileJson } from "lucide-react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Minimal demo league
const DEMO_LEAGUE = {
  version: 37,
  startingSeason: 2025,
  gameAttributes: {
    season: 2025,
    startingSeason: 2025,
    leagueName: "Demo League",
    numGames: 82,
    salaryCap: 90000,
    minPayroll: 60000,
    luxuryPayroll: 100000,
    luxuryTax: 1.5,
    minContract: 750,
    maxContract: 30000,
    numPlayoffByes: 0,
    confs: [{ cid: 0, name: "Eastern" }, { cid: 1, name: "Western" }],
    divs: [
      { did: 0, cid: 0, name: "Atlantic" }, { did: 1, cid: 0, name: "Central" },
      { did: 2, cid: 0, name: "Southeast" }, { did: 3, cid: 1, name: "Northwest" },
      { did: 4, cid: 1, name: "Pacific" }, { did: 5, cid: 1, name: "Southwest" },
    ],
  },
  teams: [
    { tid: 0, cid: 0, did: 0, region: "Boston", name: "Celtics", abbrev: "BOS", pop: 4.7, colors: ["#007A33", "#BA9653", "#FFFFFF"], imgURL: "https://cdn.ssref.net/req/202310171/tlogo/bbr/BOS-2024.png" },
    { tid: 1, cid: 0, did: 0, region: "New York", name: "Knicks", abbrev: "NYK", pop: 8.3, colors: ["#006BB6", "#F58426", "#BEC0C2"], imgURL: "https://cdn.ssref.net/req/202310171/tlogo/bbr/NYK-2024.png" },
    { tid: 2, cid: 1, did: 4, region: "Los Angeles", name: "Lakers", abbrev: "LAL", pop: 3.9, colors: ["#552583", "#FDB927", "#000000"], imgURL: "https://cdn.ssref.net/req/202310171/tlogo/bbr/LAL-2024.png" },
    { tid: 3, cid: 1, did: 5, region: "Dallas", name: "Mavericks", abbrev: "DAL", pop: 1.3, colors: ["#00538C", "#002B5E", "#B8C4CA"], imgURL: "https://cdn.ssref.net/req/202310171/tlogo/bbr/DAL-2024.png" },
    { tid: 4, cid: 0, did: 2, region: "Miami", name: "Heat", abbrev: "MIA", pop: 4.5, colors: ["#98002E", "#F9A01B", "#000000"] },
    { tid: 5, cid: 1, did: 3, region: "Denver", name: "Nuggets", abbrev: "DEN", pop: 2.9, colors: ["#0E2240", "#FEC524", "#8B2131"] },
  ],
  players: [
    { firstName: "Jayson", lastName: "Tatum", pos: "SF", tid: 0, age: 27, hgt: 80, weight: 210, born: { year: 1998, loc: "St. Louis, MO" }, college: "Duke", jerseyNumber: "0", contract: { amount: 31000, exp: 2028 }, ratings: [{ season: 2025, ovr: 89, pot: 92, hgt: 70, stre: 55, spd: 65, jmp: 60, endu: 75, ins: 65, dnk: 80, ft: 75, fg: 82, tp: 78, oiq: 85, diq: 70, drb: 80, pss: 60, reb: 65 }] },
    { firstName: "Jaylen", lastName: "Brown", pos: "SG", tid: 0, age: 28, hgt: 78, weight: 223, born: { year: 1996, loc: "Marietta, GA" }, college: "California", jerseyNumber: "7", contract: { amount: 28500, exp: 2029 }, ratings: [{ season: 2025, ovr: 84, pot: 85, hgt: 65, stre: 60, spd: 70, jmp: 75, endu: 80, ins: 60, dnk: 85, ft: 70, fg: 75, tp: 72, oiq: 75, diq: 72, drb: 70, pss: 55, reb: 60 }] },
    { firstName: "Jalen", lastName: "Brunson", pos: "PG", tid: 1, age: 28, hgt: 73, weight: 190, born: { year: 1996, loc: "New Brunswick, NJ" }, college: "Villanova", jerseyNumber: "11", contract: { amount: 26000, exp: 2028 }, ratings: [{ season: 2025, ovr: 85, pot: 86, hgt: 35, stre: 40, spd: 65, jmp: 55, endu: 80, ins: 55, dnk: 50, ft: 85, fg: 82, tp: 75, oiq: 90, diq: 55, drb: 85, pss: 78, reb: 35 }] },
    { firstName: "LeBron", lastName: "James", pos: "SF", tid: 2, age: 40, hgt: 81, weight: 250, born: { year: 1984, loc: "Akron, OH" }, college: "", jerseyNumber: "23", imgURL: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png", contract: { amount: 48000, exp: 2026 }, ratings: [{ season: 2025, ovr: 82, pot: 82, hgt: 70, stre: 80, spd: 55, jmp: 50, endu: 85, ins: 80, dnk: 75, ft: 70, fg: 75, tp: 68, oiq: 95, diq: 60, drb: 78, pss: 88, reb: 70 }] },
    { firstName: "Luka", lastName: "Doncic", pos: "PG", tid: 3, age: 26, hgt: 79, weight: 230, born: { year: 1999, loc: "Ljubljana, Slovenia" }, college: "", jerseyNumber: "77", contract: { amount: 36000, exp: 2029 }, ratings: [{ season: 2025, ovr: 91, pot: 95, hgt: 60, stre: 55, spd: 55, jmp: 50, endu: 70, ins: 65, dnk: 65, ft: 72, fg: 80, tp: 78, oiq: 95, diq: 50, drb: 90, pss: 92, reb: 65 }] },
    { firstName: "Jimmy", lastName: "Butler", pos: "SF", tid: 4, age: 35, hgt: 79, weight: 230, born: { year: 1989, loc: "Houston, TX" }, college: "Marquette", jerseyNumber: "22", contract: { amount: 25000, exp: 2026 }, ratings: [{ season: 2025, ovr: 80, pot: 80, hgt: 55, stre: 65, spd: 60, jmp: 60, endu: 75, ins: 70, dnk: 70, ft: 85, fg: 72, tp: 55, oiq: 82, diq: 78, drb: 70, pss: 65, reb: 55 }] },
    { firstName: "Nikola", lastName: "Jokic", pos: "C", tid: 5, age: 30, hgt: 83, weight: 284, born: { year: 1995, loc: "Sombor, Serbia" }, college: "", jerseyNumber: "15", contract: { amount: 51000, exp: 2028 }, ratings: [{ season: 2025, ovr: 95, pot: 95, hgt: 85, stre: 75, spd: 35, jmp: 30, endu: 80, ins: 95, dnk: 45, ft: 85, fg: 80, tp: 60, oiq: 98, diq: 55, drb: 60, pss: 95, reb: 92 }] },
    { firstName: "Anthony", lastName: "Davis", pos: "PF", tid: 2, age: 32, hgt: 82, weight: 253, born: { year: 1993, loc: "Chicago, IL" }, college: "Kentucky", jerseyNumber: "3", contract: { amount: 40000, exp: 2027 }, ratings: [{ season: 2025, ovr: 87, pot: 87, hgt: 85, stre: 70, spd: 55, jmp: 65, endu: 60, ins: 88, dnk: 80, ft: 75, fg: 65, tp: 45, oiq: 70, diq: 90, drb: 40, pss: 50, reb: 85 }] },
  ],
  draftPicks: [
    { round: 1, tid: 0, originalTid: 0, season: 2025 },
    { round: 2, tid: 0, originalTid: 0, season: 2025 },
    { round: 1, tid: 1, originalTid: 1, season: 2025 },
    { round: 2, tid: 1, originalTid: 1, season: 2025 },
    { round: 1, tid: 2, originalTid: 2, season: 2025 },
    { round: 2, tid: 2, originalTid: 2, season: 2025 },
    { round: 1, tid: 3, originalTid: 3, season: 2025 },
    { round: 2, tid: 3, originalTid: 3, season: 2025 },
  ],
  awards: [
    { season: 2024, type: "MVP", name: "Nikola Jokic" },
    { season: 2024, type: "DPOY", name: "Rudy Gobert" },
    { season: 2024, type: "Finals MVP", name: "Jaylen Brown" },
  ],
};

const FileUpload = () => {
  const { setLeague, setFileName, league, addReferenceFile } = useLeague();
  const [multiMode, setMultiMode] = useState(false);

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
          setLeague(data);
          setFileName(file.name);
          toast.success(`"${file.name}" cargado correctamente`);
        }
      } catch {
        toast.error("Error al leer el archivo JSON");
      }
    };
    reader.readAsText(file);
  }, [setLeague, setFileName, addReferenceFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 1 && !league) {
      handleFile(files[0]);
    } else if (files.length === 1) {
      handleFile(files[0], multiMode);
    } else {
      // First file as main, rest as reference
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
    setLeague(DEMO_LEAGUE as any);
    setFileName("demo-league.json");
    toast.success("Liga demo cargada con 8 jugadores y 6 equipos NBA");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-6xl md:text-8xl font-display text-gradient-fire tracking-wider mb-2">
          BBGM EDITOR
        </h1>
        <p className="text-muted-foreground text-lg">
          Edita tu archivo de Basketball GM de forma visual
        </p>
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
            <p className="text-foreground font-medium text-lg">
              Arrastra tus archivos JSON aquí
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              o haz clic para seleccionar (múltiples archivos soportados)
            </p>
          </div>
          <span className="text-xs text-muted-foreground/60">
            El primero será editable, el resto como referencia
          </span>
        </div>
      </label>

      <div className="mt-6 flex gap-3">
        <Button onClick={loadDemo} variant="outline" className="gap-2">
          <FileJson className="w-4 h-4" />
          Cargar Demo
        </Button>
        <a href="https://play.basketball-gm.com" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" className="gap-2">
            🏀 Abrir Basketball GM
          </Button>
        </a>
      </div>
    </div>
  );
};

export default FileUpload;
