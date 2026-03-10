import React from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { BBGMDraftPick } from "@/types/bbgm";
import { toast } from "sonner";

const DraftEditor = () => {
  const { league, updateDraftPicks } = useLeague();
  const picks = league?.draftPicks || [];

  const teamName = (tid: number) => {
    const team = league?.teams?.find(t => t.tid === tid);
    return team ? team.abbrev : `T${tid}`;
  };

  const updatePick = (idx: number, field: string, value: any) => {
    const updated = [...picks];
    updated[idx] = { ...updated[idx], [field]: value };
    updateDraftPicks(updated);
  };

  const deletePick = (idx: number) => {
    updateDraftPicks(picks.filter((_, i) => i !== idx));
    toast.success("Pick eliminado");
  };

  const addPick = () => {
    const newPick: BBGMDraftPick = {
      round: 1,
      tid: 0,
      originalTid: 0,
      season: (league?.gameAttributes as any)?.season || 2025,
    };
    updateDraftPicks([...picks, newPick]);
    toast.success("Pick añadido");
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">{picks.length} picks</div>
        <Button onClick={addPick} className="gap-2">+ Añadir Pick</Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary text-secondary-foreground">
                <th className="text-left p-3 font-medium">Season</th>
                <th className="text-left p-3 font-medium">Round</th>
                <th className="text-left p-3 font-medium">Pick</th>
                <th className="text-left p-3 font-medium">Equipo</th>
                <th className="text-left p-3 font-medium">Original</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {picks.map((pick, idx) => (
                <tr key={idx} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="p-3">
                    <Input type="number" value={pick.season === "fantasy" ? 0 : pick.season} onChange={e => updatePick(idx, "season", parseInt(e.target.value))} className="bg-muted border-border h-8 w-24" />
                  </td>
                  <td className="p-3">
                    <Input type="number" value={pick.round} onChange={e => updatePick(idx, "round", parseInt(e.target.value))} className="bg-muted border-border h-8 w-16" />
                  </td>
                  <td className="p-3">
                    <Input type="number" value={pick.pick ?? ""} onChange={e => updatePick(idx, "pick", parseInt(e.target.value) || undefined)} className="bg-muted border-border h-8 w-16" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Input type="number" value={pick.tid} onChange={e => updatePick(idx, "tid", parseInt(e.target.value))} className="bg-muted border-border h-8 w-16" />
                      <span className="text-xs text-primary">{teamName(pick.tid)}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Input type="number" value={pick.originalTid} onChange={e => updatePick(idx, "originalTid", parseInt(e.target.value))} className="bg-muted border-border h-8 w-16" />
                      <span className="text-xs text-muted-foreground">{teamName(pick.originalTid)}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" onClick={() => deletePick(idx)} className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DraftEditor;
