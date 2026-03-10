import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import EditSheet from "@/components/EditSheet";

const StaffEditor = () => {
  const { league, updateSection } = useLeague();
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [localStaff, setLocalStaff] = useState<any>(null);

  const teams = league?.teams || [];

  // BBGM doesn't have a dedicated staff/coaches section in most exports.
  // Some versions store coaches in teams or a top-level "coaches" array.
  const coaches = useMemo(() => {
    const list: any[] = [];
    teams.forEach((t: any, tIdx: number) => {
      if (t.coach) {
        list.push({ ...t.coach, _teamIdx: tIdx, _teamAbbrev: t.abbrev, _type: "coach", _source: "team.coach" });
      }
      if (t.staff) {
        Object.entries(t.staff).forEach(([role, person]: [string, any]) => {
          if (person) list.push({ ...person, _teamIdx: tIdx, _teamAbbrev: t.abbrev, _type: role, _source: "team.staff" });
        });
      }
    });
    if (league?.coaches) {
      (league.coaches as any[]).forEach((c: any, i: number) => {
        list.push({ ...c, _topIdx: i, _teamAbbrev: teams.find((t: any) => t.tid === c.tid)?.abbrev || "?", _type: "coach", _source: "coaches" });
      });
    }
    return list.filter(c => !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase()));
  }, [teams, league?.coaches, search]);

  const hasStaffData = coaches.length > 0;

  const openEdit = (item: any) => {
    setLocalStaff(JSON.parse(JSON.stringify(item)));
    setEditingItem(item);
  };

  // Basketball GM info
  const bbgmInfo = `Basketball GM almacena staff técnico de formas variables:
• Algunas versiones guardan "coach" dentro de cada equipo (teams[].coach)
• Otras usan un array "coaches" a nivel raíz
• Versiones más nuevas pueden incluir "staff" con roles como GM, scout, etc.

Si tu archivo no tiene datos de staff, puedes crear un array "coaches" personalizado.`;

  const createCoachesArray = () => {
    const newCoaches = teams.map((t: any) => ({
      tid: t.tid,
      firstName: "Coach",
      lastName: t.name,
      skill: "none",
    }));
    updateSection("coaches", newCoaches);
    toast.success(`${newCoaches.length} coaches creados`);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        {!hasStaffData && (
          <Button onClick={createCoachesArray} className="gap-2"><Plus className="w-3.5 h-3.5" /> Crear Staff</Button>
        )}
      </div>

      {!hasStaffData && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-2">Sin datos de Staff</h4>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{bbgmInfo}</pre>
              <Button onClick={createCoachesArray} size="sm" className="mt-3 gap-1">
                <Plus className="w-3.5 h-3.5" /> Crear coaches para todos los equipos
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground mb-2">{coaches.length} staff encontrados</div>

      {hasStaffData && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin max-h-[65vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-secondary text-secondary-foreground">
                  <th className="text-left p-3 font-medium">Equipo</th>
                  <th className="text-left p-3 font-medium">Rol</th>
                  <th className="text-left p-3 font-medium">Nombre</th>
                  <th className="text-left p-3 font-medium">Datos</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c: any, i: number) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => openEdit(c)}>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">{c._teamAbbrev}</span>
                    </td>
                    <td className="p-3 capitalize text-muted-foreground">{c._type}</td>
                    <td className="p-3 font-medium">{c.firstName || c.name || "—"} {c.lastName || ""}</td>
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

      {/* Staff Edit Sheet */}
      <EditSheet
        open={editingItem !== null}
        onClose={() => { setEditingItem(null); setLocalStaff(null); }}
        title="Editar Staff"
        description={localStaff ? `${localStaff._teamAbbrev} — ${localStaff._type}` : ""}
        onExportJson={() => localStaff}
        exportFileName="staff.json"
      >
        {localStaff && (
          <div className="space-y-4">
            {Object.keys(localStaff).filter(k => !k.startsWith("_")).map(key => {
              const val = localStaff[key];
              if (typeof val === "object" && val !== null) {
                return (
                  <div key={key}>
                    <h4 className="text-xs font-display tracking-wider text-primary mb-2 uppercase">{key}</h4>
                    <pre className="text-[10px] bg-muted rounded-lg p-3 overflow-auto max-h-32 text-muted-foreground">
                      {JSON.stringify(val, null, 2)}
                    </pre>
                  </div>
                );
              }
              return (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{key}</label>
                  <Input value={val ?? ""} readOnly className="bg-muted border-border" />
                </div>
              );
            })}
          </div>
        )}
      </EditSheet>
    </div>
  );
};

export default StaffEditor;
