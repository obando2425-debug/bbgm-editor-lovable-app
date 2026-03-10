import React, { useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";

const EconomyEditor = () => {
  const { league, updateGameAttributes } = useLeague();
  const teams = league?.teams || [];
  const players = league?.players || [];

  const getAttr = (key: string): any => {
    const ga = league?.gameAttributes;
    if (Array.isArray(ga)) return (ga as any[]).find((a: any) => a.key === key)?.value;
    return (ga as any)?.[key];
  };

  const setAttr = (key: string, value: any) => {
    const ga = league?.gameAttributes;
    if (!ga) return;
    if (Array.isArray(ga)) {
      const updated = [...(ga as any[])];
      const idx = updated.findIndex((a: any) => a.key === key);
      if (idx !== -1) updated[idx] = { ...updated[idx], value };
      else updated.push({ key, value });
      updateGameAttributes(updated as any);
    } else {
      updateGameAttributes({ ...ga, [key]: value } as any);
    }
  };

  const fields = [
    { key: "salaryCap", label: "Salary Cap ($K)" },
    { key: "minPayroll", label: "Min Payroll ($K)" },
    { key: "luxuryPayroll", label: "Luxury Tax Threshold ($K)" },
    { key: "luxuryTax", label: "Luxury Tax Rate" },
    { key: "minContract", label: "Contrato Mínimo ($K)" },
    { key: "maxContract", label: "Contrato Máximo ($K)" },
  ];

  const teamPayrolls = useMemo(() => {
    return teams.map(t => {
      const teamPlayers = players.filter(p => p.tid === t.tid);
      const payroll = teamPlayers.reduce((sum, p) => sum + (p.contract?.amount || 0), 0);
      return { tid: t.tid, abbrev: t.abbrev, region: t.region, name: t.name, payroll, count: teamPlayers.length };
    }).sort((a, b) => b.payroll - a.payroll);
  }, [teams, players]);

  const capValue = getAttr("salaryCap") || 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Salary settings */}
      <div>
        <h3 className="text-sm font-display tracking-wider text-primary uppercase mb-3">Configuración Salarial</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
              <Input
                type="number"
                value={getAttr(f.key) ?? ""}
                onChange={e => setAttr(f.key, f.key === "luxuryTax" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
                className="bg-card border-border"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Team payrolls */}
      <div>
        <h3 className="text-sm font-display tracking-wider text-primary uppercase mb-3">Masa Salarial por Equipo</h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin max-h-[55vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-secondary text-secondary-foreground">
                  <th className="text-left p-3 font-medium">Equipo</th>
                  <th className="text-left p-3 font-medium">Jugadores</th>
                  <th className="text-left p-3 font-medium">Masa Salarial</th>
                  <th className="text-left p-3 font-medium">vs Cap</th>
                </tr>
              </thead>
              <tbody>
                {teamPayrolls.map(t => {
                  const overCap = capValue > 0 && t.payroll > capValue;
                  const luxuryThreshold = getAttr("luxuryPayroll") || 0;
                  const overLuxury = luxuryThreshold > 0 && t.payroll > luxuryThreshold;
                  return (
                    <tr key={t.tid} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <span className="font-medium">{t.abbrev}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{t.region} {t.name}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{t.count}</td>
                      <td className="p-3 font-bold text-primary">${(t.payroll / 1000).toFixed(1)}M</td>
                      <td className="p-3">
                        {capValue > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${overLuxury ? "bg-destructive/10 text-destructive" : overCap ? "bg-warning/10 text-warning" : "bg-green-500/10 text-green-400"}`}>
                            {overLuxury ? "Luxury Tax" : overCap ? "Over Cap" : "Under Cap"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomyEditor;
