import React, { useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Save, Undo2, Redo2, Upload, Download } from "lucide-react";
import { toast } from "sonner";

interface EditSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onImportJson?: (data: any) => void;
  onExportJson?: () => any;
  exportFileName?: string;
}

const EditSheet: React.FC<EditSheetProps> = ({
  open, onClose, title, description, children,
  onSave, onUndo, onRedo, canUndo = false, canRedo = false,
  onImportJson, onExportJson, exportFileName = "element.json",
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportJson) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        onImportJson(data);
        toast.success("JSON importado");
      } catch { toast.error("JSON inválido"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExport = () => {
    if (!onExportJson) return;
    const data = onExportJson();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = exportFileName; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[95vw] sm:w-[90vw] sm:max-w-[900px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-3 border-b border-border shrink-0">
          <SheetTitle className="text-lg font-display tracking-wider text-primary">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {onSave && (
              <Button size="sm" onClick={onSave} className="gap-1 text-xs">
                <Save className="w-3.5 h-3.5" /> Guardar
              </Button>
            )}
            {onUndo && (
              <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo} className="gap-1 text-xs">
                <Undo2 className="w-3.5 h-3.5" /> Deshacer
              </Button>
            )}
            {onRedo && (
              <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo} className="gap-1 text-xs">
                <Redo2 className="w-3.5 h-3.5" /> Rehacer
              </Button>
            )}
            {onImportJson && (
              <>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="sr-only" />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1 text-xs">
                  <Upload className="w-3.5 h-3.5" /> Importar JSON
                </Button>
              </>
            )}
            {onExportJson && (
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 text-xs">
                <Download className="w-3.5 h-3.5" /> Exportar JSON
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditSheet;
