import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Copy, Plus } from "lucide-react";
import { toast } from "sonner";

const StaffEditor = () => {
  const { league, updateSection } = useLeague();
  const [search, setSearch] = useState("");

  // BBGM stores coaches in teams[].coach or separate coaches array
  const teams = league?.teams || [];

  const coaches = useMemo(() => {
    const list: any[] = [];
    teams.forEach((t: any, tIdx: number) => {
      if (t.coach) {
        list.push({ ...t.coach, _teamIdx: tIdx, _teamAbbrev: t.abbrev, _type: "coach" });
      }
      if (t.staff) {
        Object.entries(t.staff).forEach(([role, person]: [string, any]) => {
          if (person) list.push({ ...person, _teamIdx: tIdx, _teamAbbrev: t.abbrev, _type: role });
        });
      }
    });
    // Also check top-level coaches
    if (league?.coaches) {
      (league.coaches as any[]).forEach((c: any, i: number) => {
        list.push({ ...c, _topIdx: i, _teamAbbrev: teams.find((t: any) => t.tid === c.tid)?.abbrev || "?", _type: "coach" });
      });
    }
    return list.filter(c => !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase()));
  }, [teams, league?.coaches, search]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">{coaches.length} staff encontrados</div>

      {coaches.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No se encontró staff técnico. Este archivo puede no contener datos de coaches/staff.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin max-h-[65vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-secondary text-secondary-foreground">
                  <th className="text-left p-3 font-medium">Equipo</th>
                  <th className="text-left p-3 font-medium">Rol</th>
                  <th className="text-left p-3 font-medium">Datos</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c: any, i: number) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">{c._teamAbbrev}</span>
                    </td>
                    <td className="p-3 capitalize text-muted-foreground">{c._type}</td>
                    <td className="p-3 text-xs font-mono text-muted-foreground truncate max-w-[400px]">
                      {JSON.stringify(c, (k, v) => k.startsWith("_") ? undefined : v).slice(0, 150)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffEditor;
