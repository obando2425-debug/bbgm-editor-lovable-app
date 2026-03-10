import React, { useState, useMemo, useRef } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import EditSheet from "@/components/EditSheet";
import { toast } from "sonner";

const ContractsEditor = () => {
  const { league, updatePlayers } = useLeague();
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [localContract, setLocalContract] = useState<any>(null);
  const prevRef = useRef<any>(null);

  const players = league?.players || [];
  const teams = league?.teams || [];

  const playersWithContracts = useMemo(() => {
    return players
      .map((p: any, i: number) => ({ ...p, _idx: i }))
      .filter((p: any) => p.contract && p.tid >= 0)
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
    prevRef.current = { ...p.contract };
    setLocalContract({ ...p.contract, _playerIdx: p._idx, _name: `${p.firstName} ${p.lastName}`, _tid: p.tid });
    setEditingIdx(p._idx);
  };

  const saveContract = () => {
    if (editingIdx === null || !localContract) return;
    const updated = [...players];
    const { _playerIdx, _name, _tid, ...contract } = localContract;
    updated[editingIdx] = { ...updated[editingIdx], contract };
    updatePlayers(updated);
    setEditingIdx(null);
    setLocalContract(null);
    toast.success("Contrato guardado");
  };

  const undoContract = () => {
    if (prevRef.current && localContract) {
      setLocalContract({ ...prevRef.current, _playerIdx: localContract._playerIdx, _name: localContract._name, _tid: localContract._tid });
    }
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
          {teams.map((t: any) => <option key={t.tid} value={t.tid}>{t.abbrev} - {t.region}</option>)}
        </select>
      </div>

      {totalSalary !== null && (
        <div className="bg-card border border-border rounded-lg p-3 mb-4 flex gap-4 text-sm">
          <span className="text-muted-foreground">Total Salary:</span>
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
              {playersWithContracts.map((p: any) => (
                <tr key={p._idx} className="border-t border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openEdit(p)}>
                  <td className="p-3 font-medium">{p.firstName} {p.lastName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                      {teams.find((t: any) => t.tid === p.tid)?.abbrev || `T${p.tid}`}
                    </span>
                  </td>
                  <td className="p-3 text-primary font-bold">${((p.contract?.amount || 0) / 1000).toFixed(1)}M</td>
                  <td className="p-3 text-muted-foreground">{p.contract?.exp || "—"}</td>
                  <td className="p-3">{p.ratings?.[p.ratings.length - 1]?.ovr ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.age ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Contract Sheet */}
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
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Equipo</label>
              <select
                value={localContract._tid ?? -1}
                onChange={e => {
                  const newTid = parseInt(e.target.value);
                  setLocalContract((prev: any) => ({ ...prev, _tid: newTid }));
                  // Also update the player's tid
                  if (editingIdx !== null) {
                    const updated = [...players];
                    updated[editingIdx] = { ...updated[editingIdx], tid: newTid };
                    updatePlayers(updated);
                  }
                }}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value={-1}>Free Agent</option>
                {teams.map((t: any) => <option key={t.tid} value={t.tid}>{t.abbrev} — {t.region} {t.name}</option>)}
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
              </div>
            </div>
          </div>
        )}
      </EditSheet>
    </div>
  );
};

export default ContractsEditor;
