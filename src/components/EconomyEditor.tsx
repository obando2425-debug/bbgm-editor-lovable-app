import React, { useMemo, useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import EditSheet from "@/components/EditSheet";
import { TrendingUp, Users, ChevronRight } from "lucide-react";

const EconomyEditor = () => {
  const { league, updateGameAttributes, updateTeams, updatePlayers, setActiveTab } = useLeague();
  const teams = league?.teams || [];
  const players = league?.players || [];
  const [leagueFinOpen, setLeagueFinOpen] = useState(false);
  const [teamFinOpen, setTeamFinOpen] = useState(false);
  const [selectedTid, setSelectedTid] = useState<number | null>(null);

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

  const teamPayrolls = useMemo(() => {
    return teams.map((t: any) => {
      const teamPlayers = players.filter(p => p.tid === t.tid);
      const payroll = teamPlayers.reduce((sum, p) => sum + (p.contract?.amount || 0), 0);
      const budget = t.budget || {};
      return {
        tid: t.tid, abbrev: t.abbrev || "", region: t.region || "", name: t.name || "",
        payroll, count: teamPlayers.length,
        pop: t.pop || 0,
        attendance: t.stadiumCapacity || budget.ticketPrice?.amount ? Math.round((t.pop || 1) * 15000) : 0,
        ticketPrice: budget.ticketPrice?.amount ?? 0,
        revenue: (t as any).revenues?.totalRevenue?.amount ?? 0,
        profit: (t as any).revenues?.totalRevenue?.amount ? ((t as any).revenues.totalRevenue.amount - payroll) : 0,
        cash: (t as any).cash ?? 0,
        strategy: (t as any).strategy || "contending",
        scouting: budget.scouting?.amount ?? 0,
        coaching: budget.coaching?.amount ?? 0,
        health: budget.health?.amount ?? 0,
        facilities: budget.facilities?.amount ?? 0,
      };
    }).sort((a, b) => b.payroll - a.payroll);
  }, [teams, players]);

  const capValue = getAttr("salaryCap") || 0;
  const luxuryPayroll = getAttr("luxuryPayroll") || 0;
  const minPayroll = getAttr("minPayroll") || 0;

  const updateTeamBudget = (tid: number, field: string, value: number) => {
    const newTeams = teams.map((t: any) => {
      if (t.tid !== tid) return t;
      const budget = { ...(t.budget || {}) };
      budget[field] = { ...(budget[field] || {}), amount: value };
      return { ...t, budget };
    });
    updateTeams(newTeams);
  };

  const updateTeamField = (tid: number, field: string, value: any) => {
    const newTeams = teams.map((t: any) => t.tid === tid ? { ...t, [field]: value } : t);
    updateTeams(newTeams);
  };

  const selectedTeam = selectedTid !== null ? teamPayrolls.find(t => t.tid === selectedTid) : null;
  const selectedTeamPlayers = selectedTid !== null ? players.filter(p => p.tid === selectedTid) : [];
  const selectedTeamRaw = selectedTid !== null ? teams.find((t: any) => t.tid === selectedTid) as any : null;

  const budgetItems = [
    { key: "scouting", label: "Scouting", desc: "Inversión en ojeadores — afecta calidad de draft y detección de agentes libres subvalorados" },
    { key: "coaching", label: "Coaching", desc: "Cuerpo técnico y desarrollo — afecta progresión de jugadores" },
    { key: "health", label: "Salud", desc: "Personal médico y prevención — afecta duración de lesiones" },
    { key: "facilities", label: "Instalaciones", desc: "Infraestructura del club — afecta humor de jugadores, demanda de entradas y atracción de agentes libres" },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      {/* Two main cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setLeagueFinOpen(true)}
          className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg tracking-wider text-primary">Finanzas de Liga</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Límites salariales y vista general de equipos</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-3">
            <span>Cap: ${(capValue / 1000).toFixed(0)}M</span>
            <span>Luxury: ${(luxuryPayroll / 1000).toFixed(0)}M</span>
            <span>{teams.length} equipos</span>
          </div>
        </button>

        <button
          onClick={() => { setTeamFinOpen(true); if (selectedTid === null && teams.length > 0) setSelectedTid((teams[0] as any).tid); }}
          className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg tracking-wider text-primary">Finanzas por Equipo</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Presupuestos, nómina y gastos por equipo</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-3">
            <span>{players.length} jugadores</span>
            <span>Nómina total: ${(teamPayrolls.reduce((s, t) => s + t.payroll, 0) / 1000).toFixed(0)}M</span>
          </div>
        </button>
      </div>

      {/* League Finances Sheet */}
      <EditSheet
        open={leagueFinOpen}
        onClose={() => setLeagueFinOpen(false)}
        title="Finanzas de Liga"
        description="Límites financieros y vista comparativa de equipos"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Límites Financieros</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: "salaryCap", label: "Tope Salarial ($K)" },
                { key: "minPayroll", label: "Nómina Mínima ($K)" },
                { key: "luxuryPayroll", label: "Impuesto de Lujo ($K)" },
                { key: "luxuryTax", label: "Tasa Impuesto de Lujo" },
                { key: "minContract", label: "Contrato Mínimo ($K)" },
                { key: "maxContract", label: "Contrato Máximo ($K)" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <Input
                    type="number"
                    value={getAttr(f.key) ?? ""}
                    onChange={e => setAttr(f.key, f.key === "luxuryTax" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
                    className="bg-muted border-border"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Comparativa de Equipos</h4>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin max-h-[50vh]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-secondary text-secondary-foreground">
                      <th className="text-left p-2 font-medium">Equipo</th>
                      <th className="text-right p-2 font-medium">Pob.</th>
                      <th className="text-right p-2 font-medium">Nómina</th>
                      <th className="text-right p-2 font-medium">Cap Space</th>
                      <th className="text-right p-2 font-medium">Roster</th>
                      <th className="text-center p-2 font-medium">Estrategia</th>
                      <th className="text-right p-2 font-medium">Scouting</th>
                      <th className="text-right p-2 font-medium">Coaching</th>
                      <th className="text-right p-2 font-medium">Salud</th>
                      <th className="text-right p-2 font-medium">Instal.</th>
                      <th className="text-center p-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPayrolls.map(t => {
                      const overCap = capValue > 0 && t.payroll > capValue;
                      const overLuxury = luxuryPayroll > 0 && t.payroll > luxuryPayroll;
                      const capSpace = capValue > 0 ? capValue - t.payroll : 0;
                      return (
                        <tr
                          key={t.tid}
                          className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => { setLeagueFinOpen(false); setSelectedTid(t.tid); setTeamFinOpen(true); }}
                        >
                          <td className="p-2">
                            <span className="font-medium">{t.abbrev}</span>
                            <span className="text-muted-foreground ml-1">{t.region}</span>
                          </td>
                          <td className="p-2 text-right text-muted-foreground">{t.pop.toFixed(1)}</td>
                          <td className="p-2 text-right font-medium text-primary">${(t.payroll / 1000).toFixed(1)}M</td>
                          <td className={`p-2 text-right ${capSpace < 0 ? "text-destructive" : "text-green-400"}`}>${(capSpace / 1000).toFixed(1)}M</td>
                          <td className="p-2 text-right text-muted-foreground">{t.count}</td>
                          <td className="p-2 text-center">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{t.strategy}</span>
                          </td>
                          <td className="p-2 text-right text-muted-foreground">{t.scouting}</td>
                          <td className="p-2 text-right text-muted-foreground">{t.coaching}</td>
                          <td className="p-2 text-right text-muted-foreground">{t.health}</td>
                          <td className="p-2 text-right text-muted-foreground">{t.facilities}</td>
                          <td className="p-2 text-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${overLuxury ? "bg-destructive/10 text-destructive" : overCap ? "bg-warning/10 text-warning" : "bg-green-500/10 text-green-400"}`}>
                              {overLuxury ? "Luxury" : overCap ? "Over" : "Under"}
                            </span>
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
      </EditSheet>

      {/* Team Finances Sheet */}
      <EditSheet
        open={teamFinOpen}
        onClose={() => setTeamFinOpen(false)}
        title={selectedTeam ? `Finanzas — ${selectedTeam.abbrev} ${selectedTeam.region} ${selectedTeam.name}` : "Finanzas por Equipo"}
        description="Presupuesto, gastos y nómina del equipo"
      >
        <div className="space-y-6">
          {/* Team selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Seleccionar equipo</label>
            <select
              value={selectedTid ?? ""}
              onChange={e => setSelectedTid(parseInt(e.target.value))}
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground"
            >
              {teams.map((t: any) => <option key={t.tid} value={t.tid}>{t.abbrev} — {t.region || ""} {t.name || ""}</option>)}
            </select>
          </div>

          {selectedTeam && (
            <>
              {/* Salary limits */}
              <div>
                <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Situación Salarial</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted rounded-lg p-3">
                    <span className="text-[10px] text-muted-foreground block">Nómina Actual</span>
                    <span className="text-lg font-bold text-primary">${(selectedTeam.payroll / 1000).toFixed(1)}M</span>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <span className="text-[10px] text-muted-foreground block">Tope Salarial</span>
                    <span className="text-lg font-bold text-foreground">${(capValue / 1000).toFixed(1)}M</span>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <span className="text-[10px] text-muted-foreground block">Cap Space</span>
                    <span className={`text-lg font-bold ${capValue - selectedTeam.payroll < 0 ? "text-destructive" : "text-green-400"}`}>
                      ${((capValue - selectedTeam.payroll) / 1000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <span className="text-[10px] text-muted-foreground block">Jugadores</span>
                    <span className="text-lg font-bold text-foreground">{selectedTeam.count}</span>
                  </div>
                </div>
              </div>

              {/* Budget sliders */}
              <div>
                <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Presupuesto Operativo</h4>
                <div className="space-y-4">
                  {budgetItems.map(item => {
                    const val = selectedTeamRaw?.budget?.[item.key]?.amount ?? 0;
                    return (
                      <div key={item.key} className="bg-muted rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          <Input
                            type="number"
                            value={val}
                            onChange={e => updateTeamBudget(selectedTid!, item.key, parseInt(e.target.value) || 0)}
                            className="w-20 h-7 text-xs bg-card border-border text-right"
                          />
                        </div>
                        <Slider
                          value={[Math.min(val / 100, 100)]}
                          max={100}
                          step={1}
                          onValueChange={([v]) => updateTeamBudget(selectedTid!, item.key, v * 100)}
                          className="my-2"
                        />
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ticket price */}
              <div>
                <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Entradas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Precio de Boletos ($)</label>
                    <Input
                      type="number"
                      value={selectedTeamRaw?.budget?.ticketPrice?.amount ?? ""}
                      onChange={e => updateTeamBudget(selectedTid!, "ticketPrice", parseFloat(e.target.value) || 0)}
                      className="bg-card border-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Estrategia</label>
                    <select
                      value={(selectedTeamRaw as any)?.strategy || "contending"}
                      onChange={e => updateTeamField(selectedTid!, "strategy", e.target.value)}
                      className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
                    >
                      <option value="contending">Contending</option>
                      <option value="rebuilding">Rebuilding</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Player payroll table */}
              <div>
                <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Nómina por Jugador</h4>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto scrollbar-thin max-h-[40vh]">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-secondary text-secondary-foreground">
                          <th className="text-left p-2 font-medium">Pos</th>
                          <th className="text-left p-2 font-medium">Jugador</th>
                          <th className="text-right p-2 font-medium">Salario</th>
                          <th className="text-right p-2 font-medium">% Cap</th>
                          <th className="text-right p-2 font-medium">Años</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTeamPlayers
                          .sort((a, b) => (b.contract?.amount || 0) - (a.contract?.amount || 0))
                          .map((p, i) => {
                            const amt = p.contract?.amount || 0;
                            const pct = capValue > 0 ? ((amt / capValue) * 100).toFixed(1) : "—";
                            const season = getAttr("season") || 2025;
                            const yearsLeft = p.contract?.exp ? p.contract.exp - season : 0;
                            return (
                              <tr key={i} className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => { setTeamFinOpen(false); setActiveTab("contracts"); }}>
                                <td className="p-2 text-muted-foreground">{p.pos || "—"}</td>
                                <td className="p-2 font-medium">{p.firstName} {p.lastName}</td>
                                <td className="p-2 text-right text-primary font-medium">${(amt / 1000).toFixed(1)}M</td>
                                <td className="p-2 text-right text-muted-foreground">{pct}%</td>
                                <td className="p-2 text-right text-muted-foreground">{yearsLeft > 0 ? yearsLeft : "—"}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Coaches subsection if they exist */}
              {(selectedTeamRaw?.coach || (league as any)?.coaches?.filter((c: any) => c.tid === selectedTid)?.length > 0) && (
                <div>
                  <h4 className="text-xs font-display tracking-wider text-primary mb-3 uppercase">Cuerpo Técnico</h4>
                  <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
                    {selectedTeamRaw?.coach && (
                      <div>Coach: {selectedTeamRaw.coach.firstName || selectedTeamRaw.coach.name || "—"} {selectedTeamRaw.coach.lastName || ""}</div>
                    )}
                    {(league as any)?.coaches?.filter((c: any) => c.tid === selectedTid).map((c: any, i: number) => (
                      <div key={i}>{c.firstName || "Coach"} {c.lastName || ""}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </EditSheet>
    </div>
  );
};

export default EconomyEditor;
