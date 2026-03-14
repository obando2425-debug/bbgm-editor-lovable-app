import React, { useState, useMemo, useRef } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Sparkles } from "lucide-react";
import EditSheet from "@/components/EditSheet";
import { toast } from "sonner";

/** Compute age from born.year and current season */
const getAge = (p: any, season: number): number | null => {
  if (p.age) return p.age;
  if (p.born?.year) return season - p.born.year;
  return null;
};

/** Generate a suggested contract based on OVR and POT */
const suggestContract = (ovr: number, pot: number, season: number): { amount: number; exp: number } => {
  // Base calculation: higher OVR = higher salary
  const ovrFactor = Math.max(0, ovr - 40) / 60; // 0 at 40 OVR, 1 at 100 OVR
  const potBonus = Math.max(0, pot - ovr) * 50; // Bonus for high potential
  const amount = Math.round(750 + ovrFactor * 29000 + potBonus);
  const years = ovr >= 80 ? 4 : ovr >= 65 ? 3 : 2;
  return { amount: Math.min(amount, 35000), exp: season + years };
};

const ContractsEditor = () => {
  const { league, updatePlayers } = useLeague();
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [localContract, setLocalContract] = useState<any>(null);
  const prevRef = useRef<any>(null);

  const players = league?.players || [];
  const teams = league?.teams || [];

  const getSeason = (): number => {
    const ga = league?.gameAttributes;
    if (Array.isArray(ga)) return (ga as any[]).find((a: any) => a.key === "season")?.value || new Date().getFullYear();
    return (ga as any)?.season || new Date().getFullYear();
  };
  const currentSeason = getSeason();

  const playersWithContracts = useMemo(() => {
    return players
      .map((p: any, i: number) => ({ ...p, _idx: i }))
      .filter((p: any) => {
        const matchSearch = !search || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
        const matchTeam = !teamFilter || String(p.tid) === teamFilter;
        return matchSearch && matchTeam;
      })
      .sort((a: any, b: any) => (b.contract?.amount || 0) - (a.contract?.amount || 0));
  }, [players, search, teamFilter]);

  const totalSalary = useMemo(() => {
    if (!teamFilter) return null;
    return playersWithContracts.reduce((sum: number, p: any) => sum + (p.contract?.amount || 0), 0);
  }, [playersWithContracts, teamFilter]);

  const openEdit = (p: any) => {
    prevRef.current = { amount: p.contract?.amount, exp: p.contract?.exp };
    setLocalContract({
      amount: p.contract?.amount || 0,
      exp: p.contract?.exp || currentSeason + 1,
      _playerIdx: p._idx,
      _name: `${p.firstName} ${p.lastName}`,
      _tid: p.tid,
      _ovr: p.ratings?.[p.ratings.length - 1]?.ovr ?? 0,
      _pot: p.ratings?.[p.ratings.length - 1]?.pot ?? 0,
      _age: getAge(p, currentSeason),
    });
    setEditingIdx(p._idx);
  };

  const saveContract = () => {
    if (editingIdx === null || !localContract) return;
    const updated = [...players];
    const { _playerIdx, _name, _tid, _ovr, _pot, _age, ...contract } = localContract;
    updated[editingIdx] = { ...updated[editingIdx], contract: { amount: contract.amount, exp: contract.exp }, tid: _tid };
    updatePlayers(updated);
    setEditingIdx(null);
    setLocalContract(null);
    toast.success("Contrato guardado");
  };

  const undoContract = () => {
    if (prevRef.current && localContract) {
      setLocalContract({ ...localContract, amount: prevRef.current.amount, exp: prevRef.current.exp });
    }
  };

  const generateSuggested = () => {
    if (!localContract) return;
    const suggested = suggestContract(localContract._ovr || 50, localContract._pot || 50, currentSeason);
    setLocalContract((prev: any) => ({ ...prev, amount: suggested.amount, exp: suggested.exp }));
    toast.success("Contrato sugerido generado");
  };

  const syncContracts = () => {
    let count = 0;
    const updated = players.map((p: any) => {
      if (!p.contract || (!p.contract.amount && !p.contract.exp)) {
        count++;
        const ovr = p.ratings?.[p.ratings.length - 1]?.ovr ?? 50;
        const pot = p.ratings?.[p.ratings.length - 1]?.pot ?? 50;
        return { ...p, contract: suggestContract(ovr, pot, currentSeason) };
      }
      return p;
    });
    if (count > 0) {
      updatePlayers(updated);
      toast.success(`${count} contratos generados`);
    } else {
      toast.info("Todos los jugadores ya tienen contrato");
    }
  };

  const teamLabel = (tid: number) => {
    if (tid === -1) return "FA";
    if (tid === -2) return "RET";
    return teams.find((t: any) => t.tid === tid)?.abbrev || `T${tid}`;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground">
          <option value="">Todos los equipos</option>
          <option value="-1">Free Agents</option>
          {teams.map((t: any) => <option key={t.tid} value={t.tid}>{t.abbrev} - {(t as any).region}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={syncContracts} className="gap-1 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
        </Button>
      </div>

      {totalSalary !== null && (
        <div className="bg-card border border-border rounded-lg p-3 mb-4 flex gap-4 text-sm">
          <span className="text-muted-foreground">Nómina total:</span>
          <span className="text-primary font-bold">${(totalSalary / 1000).toFixed(1)}M</span>
          <span className="text-muted-foreground">({playersWithContracts.length} jugadores)</span>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary text-secondary-foreground">
                <th className="text-left p-3 font-medium">Jugador</th>
                <th className="text-left p-3 font-medium">Equipo</th>
                <th className="text-left p-3 font-medium">Salario</th>
                <th className="text-left p-3 font-medium">Exp</th>
                <th className="text-left p-3 font-medium">OVR</th>
                <th className="text-left p-3 font-medium">Edad</th>
              </tr>
            </thead>
            <tbody>
              {playersWithContracts.map((p: any) => {
                const ovr = p.ratings?.[p.ratings.length - 1]?.ovr;
                const age = getAge(p, currentSeason);
                return (
                  <tr key={p._idx} className="border-t border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openEdit(p)}>
                    <td className="p-3 font-medium">{p.firstName} {p.lastName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                        {teamLabel(p.tid)}
                      </span>
                    </td>
                    <td className="p-3 text-primary font-bold">${((p.contract?.amount || 0) / 1000).toFixed(1)}M</td>
                    <td className="p-3 text-muted-foreground">{p.contract?.exp || "—"}</td>
                    <td className="p-3">{ovr ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{age ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EditSheet
        open={editingIdx !== null}
        onClose={() => { setEditingIdx(null); setLocalContract(null); }}
        title={localContract ? `Contrato — ${localContract._name}` : "Contrato"}
        description="Edita los campos del contrato"
        onSave={saveContract}
        onUndo={undoContract}
        canUndo={true}
        onExportJson={() => localContract ? { amount: localContract.amount, exp: localContract.exp } : null}
        exportFileName="contract.json"
      >
        {localContract && (
          <div className="space-y-4">
            {/* Player info summary */}
            <div className="bg-muted rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] text-muted-foreground block">OVR</span>
                <span className="text-lg font-bold text-primary">{localContract._ovr || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">POT</span>
                <span className="text-lg font-bold text-foreground">{localContract._pot || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Edad</span>
                <span className="text-lg font-bold text-foreground">{localContract._age ?? "—"}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Equipo</label>
              <select
                value={localContract._tid ?? -1}
                onChange={e => setLocalContract((prev: any) => ({ ...prev, _tid: parseInt(e.target.value) }))}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value={-1}>Free Agent</option>
                {teams.map((t: any) => <option key={t.tid} value={t.tid}>{t.abbrev} — {(t as any).region} {(t as any).name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Salario ($K)</label>
                <Input type="number" value={localContract.amount ?? ""} onChange={e => setLocalContract((prev: any) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))} className="bg-muted border-border" />
                <p className="text-[10px] text-muted-foreground mt-1">${((localContract.amount || 0) / 1000).toFixed(1)}M/año</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Expiración (año)</label>
                <Input type="number" value={localContract.exp ?? ""} onChange={e => setLocalContract((prev: any) => ({ ...prev, exp: parseInt(e.target.value) || 0 }))} className="bg-muted border-border" />
                <p className="text-[10px] text-muted-foreground mt-1">{localContract.exp ? `${localContract.exp - currentSeason} años restantes` : ""}</p>
              </div>
            </div>

            {/* Suggest contract button */}
            <Button variant="outline" onClick={generateSuggested} className="w-full gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Generar contrato sugerido (basado en OVR/POT)
            </Button>
          </div>
        )}
      </EditSheet>
    </div>
  );
};

export default ContractsEditor;
