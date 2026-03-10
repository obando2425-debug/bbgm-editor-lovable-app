import React, { useCallback } from "react";
import { Upload } from "lucide-react";
import { useLeague } from "@/context/LeagueContext";
import { toast } from "sonner";

const FileUpload = () => {
  const { setLeague, setFileName } = useLeague();

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".json")) {
      toast.error("Solo se aceptan archivos JSON");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setLeague(data);
        setFileName(file.name);
        toast.success(`"${file.name}" cargado correctamente`);
      } catch {
        toast.error("Error al leer el archivo JSON");
      }
    };
    reader.readAsText(file);
  }, [setLeague, setFileName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

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
        <input type="file" accept=".json" onChange={handleChange} className="sr-only" />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium text-lg">
              Arrastra tu archivo JSON aquí
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              o haz clic para seleccionar
            </p>
          </div>
          <span className="text-xs text-muted-foreground/60">
            Formatos: Basketball GM Export (.json)
          </span>
        </div>
      </label>
    </div>
  );
};

export default FileUpload;
