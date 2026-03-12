import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Copy, ChevronDown, ChevronRight } from "lucide-react";
import EditSheet from "@/components/EditSheet";
import { toast } from "sonner";

interface Props {
  sectionKey: string;
  itemLabel: string;
}

/** Generic editor for any array-based section (retiredPlayers, hallOfFame, messages, etc.) */
const GenericSectionEditor = ({ sectionKey, itemLabel }: Props) => {
  const { league, updateSection } = useLeague();
  const [search, setSearch] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [localItem, setLocalItem] = useState<any>(null);

  const items: any[] = (league as any)?.[sectionKey] || [];

  const getDisplayName = (item: any): string => {
    if (item.firstName && item.lastName) return `${item.firstName} ${item.lastName}`;
    if (item.name) return item.name;
    if (item.text) return item.text.slice(0, 60);
    if (item.from) return `De: ${item.from}`;
    return JSON.stringify(item).slice(0, 60);
  };

  const filtered = useMemo(() => {
    return items.map((item, i) => ({ ...item, _idx: i })).filter(item => {
      if (!search) return true;
      return JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
    });
  }, [items, search]);

  const openEdit = (idx: number) => {
    setLocalItem(JSON.parse(JSON.stringify(items[idx])));
    setEditingIdx(idx);
  };

  const saveItem = () => {
    if (editingIdx === null || !localItem) return;
    const updated = [...items];
    updated[editingIdx] = localItem;
    updateSection(sectionKey, updated);
    setEditingIdx(null);
    toast.success(`${itemLabel} guardado`);
  };

  const deleteItem = (idx: number) => {
    updateSection(sectionKey, items.filter((_, i) => i !== idx));
    toast.success(`${itemLabel} eliminado`);
  };

  const duplicateItem = (idx: number) => {
    const clone = JSON.parse(JSON.stringify(items[idx]));
    updateSection(sectionKey, [...items, clone]);
    toast.success(`${itemLabel} duplicado`);
  };

  const renderFields = (obj: any, path: string = "") => {
    if (!obj || typeof obj !== "object") return null;
    return Object.entries(obj).filter(([k]) => !k.startsWith("_")).map(([key, val]) => {
      const fullPath = path ? `${path}.${key}` : key;
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        return (
          <div key={fullPath} className="col-span-full">
            <h5 className="text-[10px] text-primary font-medium uppercase mt-2 mb-1">{key}</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-2 border-l border-border">
              {renderFields(val, fullPath)}
            </div>
          </div>
        );
      }
      if (Array.isArray(val)) {
        return (
          <div key={fullPath} className="col-span-full">
            <label className="text-[10px] text-muted-foreground block mb-0.5">{key} ({val.length} items)</label>
            <textarea
              value={JSON.stringify(val, null, 1)}
              onChange={e => { try { updateLocalField(fullPath, JSON.parse(e.target.value)); } catch {} }}
              className="w-full bg-muted border border-border rounded-md p-2 text-[10px] font-mono text-foreground h-16 resize-y"
            />
          </div>
        );
      }
      return (
        <div key={fullPath}>
          <label className="text-[10px] text-muted-foreground block mb-0.5">{key}</label>
          {typeof val === "boolean" ? (
            <button
              onClick={() => updateLocalField(fullPath, !val)}
              className={`w-10 h-5 rounded-full transition-colors ${val ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-card shadow transition-transform ${val ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          ) : (
            <Input
              type={typeof val === "number" ? "number" : "text"}
              value={val ?? ""}
              onChange={e => updateLocalField(fullPath, typeof val === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
              className="bg-muted border-border h-7 text-xs"
            />
          )}
        </div>
      );
    });
  };

  const updateLocalField = (path: string, value: any) => {
    setLocalItem((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={`Buscar ${itemLabel.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">{filtered.length} {itemLabel.toLowerCase()}s</div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-y-auto scrollbar-thin max-h-[65vh]">
          {filtered.map(item => (
            <div
              key={item._idx}
              className="flex items-center justify-between p-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => openEdit(item._idx)}
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">{getDisplayName(item)}</span>
                {item.season && <span className="text-[10px] text-muted-foreground">Temporada {item.season}</span>}
              </div>
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={() => duplicateItem(item._idx)} className="h-7 w-7"><Copy className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteItem(item._idx)} className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditSheet
        open={editingIdx !== null}
        onClose={() => { setEditingIdx(null); setLocalItem(null); }}
        title={localItem ? getDisplayName(localItem) : itemLabel}
        description={`Editar ${itemLabel.toLowerCase()}`}
        onSave={saveItem}
        onExportJson={() => localItem}
        onImportJson={(data) => setLocalItem(data)}
        exportFileName={`${sectionKey}-item.json`}
      >
        {localItem && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {renderFields(localItem)}
          </div>
        )}
      </EditSheet>
    </div>
  );
};

export default GenericSectionEditor;
