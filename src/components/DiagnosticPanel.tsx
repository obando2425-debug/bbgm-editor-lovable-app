import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { generateDiagnosticReport, validateLeague } from "@/lib/bbgm-validator";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Wrench } from "lucide-react";
import { toast } from "sonner";
import { addNotification } from "@/lib/bbgm-notifications";

const DiagnosticPanel = ({ onClose }: { onClose: () => void }) => {
  const { league, setLeague } = useLeague();
  const [report, setReport] = useState<ReturnType<typeof generateDiagnosticReport> | null>(null);

  const runDiagnostic = () => {
    if (!league) { toast.error("No hay liga cargada"); return; }
    const r = generateDiagnosticReport(league);
    setReport(r);
    if (r.errors > 0) {
      addNotification({ type: "error", title: "Diagnóstico: errores detectados", message: `${r.errors} errores, ${r.warnings} advertencias` });
    }
  };

  const autoFixAll = () => {
    if (!league) return;
    const fixed = JSON.parse(JSON.stringify(league));
    const issues = validateLeague(fixed, true);
    const fixedCount = issues.filter(i => i.autoFixed).length;
    setLeague(fixed);
    toast.success(`${fixedCount} problemas corregidos`);
    addNotification({ type: "success", title: "Auto-corrección completada", message: `${fixedCount} valores corregidos` });
    setReport(null);
    runDiagnostic();
  };

  const severityColor = {
    error: "text-destructive bg-destructive/10",
    warning: "text-yellow-400 bg-yellow-500/10",
    info: "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg tracking-wider text-primary">Diagnóstico JSON</h2>
          </div>
          <div className="flex gap-2">
            {!report && <Button size="sm" onClick={runDiagnostic}>Ejecutar diagnóstico</Button>}
            <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!report ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Pulsa "Ejecutar diagnóstico" para analizar el JSON</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-primary">{report.completionPercent}%</span>
                  <span className="text-[10px] text-muted-foreground block">Completitud</span>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-destructive">{report.errors}</span>
                  <span className="text-[10px] text-muted-foreground block">Errores</span>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-yellow-400">{report.warnings}</span>
                  <span className="text-[10px] text-muted-foreground block">Advertencias</span>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-foreground">{report.totalFields}</span>
                  <span className="text-[10px] text-muted-foreground block">Elementos</span>
                </div>
              </div>

              {/* Section breakdown */}
              <div>
                <h3 className="text-xs font-display tracking-wider text-primary mb-2 uppercase">Por sección</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(report.sectionBreakdown).map(([key, val]) => (
                    <div key={key} className="bg-muted rounded-lg p-2.5">
                      <span className="text-xs font-medium text-foreground capitalize">{key}</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="text-green-400">{val.complete} ok</span>
                        <span className="text-muted-foreground">/ {val.total}</span>
                        {val.errors > 0 && <span className="text-destructive">{val.errors} err</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues */}
              {report.issues.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-display tracking-wider text-primary uppercase">Problemas detectados</h3>
                    <Button size="sm" variant="outline" onClick={autoFixAll} className="gap-1 text-xs">
                      <Wrench className="w-3 h-3" /> Corregir todo
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-thin">
                    {report.issues.map(issue => (
                      <div key={issue.id} className={`rounded-lg px-3 py-2 border text-xs ${severityColor[issue.severity]}`}>
                        <div className="flex items-center gap-2">
                          {issue.severity === "error" ? <AlertCircle className="w-3 h-3 shrink-0" /> :
                           issue.severity === "warning" ? <AlertTriangle className="w-3 h-3 shrink-0" /> :
                           <Info className="w-3 h-3 shrink-0" />}
                          <span className="flex-1">{issue.message}</span>
                          {issue.autoFixed && <span className="text-green-400 text-[10px] shrink-0">Auto-corregido</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.issues.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400 font-medium">Sin problemas detectados</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPanel;
