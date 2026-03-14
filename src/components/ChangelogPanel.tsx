import React, { useState, useEffect } from "react";
import { X, Sparkles, Bug, Rocket, Plus, Trash2, ChevronDown, ChevronRight, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChangelogEntry {
  id: string;
  text: string;
}

interface VersionEntry {
  id: string;
  date: string;
  features: ChangelogEntry[];
  bugfixes: ChangelogEntry[];
  upcoming: ChangelogEntry[];
}

const CHANGELOG_KEY = "bbgm-changelog";

const loadChangelog = (): VersionEntry[] => {
  try {
    const saved = localStorage.getItem(CHANGELOG_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return getDefaultChangelog();
};

const saveChangelog = (data: VersionEntry[]) => {
  try { localStorage.setItem(CHANGELOG_KEY, JSON.stringify(data)); } catch {}
};

function getDefaultChangelog(): VersionEntry[] {
  return [
    {
      id: "v1",
      date: "14 marzo 2026",
      features: [
        { id: "f1", text: "Sistema de guardado persistente con IndexedDB y archivo de proyecto descargable — tus sesiones sobreviven al cierre del navegador y pueden transferirse entre dispositivos" },
        { id: "f2", text: "Propagación inteligente de cambios: al eliminar un equipo, los jugadores pasan automáticamente a Free Agents; al cambiar el salary cap, se notifican los equipos que lo superan" },
        { id: "f3", text: "Banners de notificación temporales para alertas críticas — aparecen visualmente en pantalla y se pueden deslizar para cerrar" },
        { id: "f4", text: "Diagnóstico mejorado que detecta campos vacíos, valores fuera de rango, y relaciones rotas entre objetos del JSON" },
        { id: "f5", text: "Buscador global mejorado: los resultados ahora muestran el nombre del jugador/equipo, la sección y el campo específico donde se encontró el valor" },
        { id: "f6", text: "Sección Novedades con identidad visual propia para documentar cambios, bugs corregidos y funciones próximas" },
        { id: "f7", text: "Aurora AI procesa archivos adjuntos como carga interna independiente del texto del mensaje, sin límite práctico de tamaño" },
        { id: "f8", text: "Aurora AI genera valores únicos y variados al crear múltiples jugadores o equipos — sin repeticiones" },
      ],
      bugfixes: [
        { id: "b1", text: "Corregido: el cargador de JSON fallaba con 'Error al leer el archivo' porque un catch genérico capturaba errores de merge y validación sin distinguirlos" },
        { id: "b2", text: "Corregido: el merge con esquema se omitía silenciosamente al fallar, dejando campos incompletos sin avisar al usuario" },
        { id: "b3", text: "Corregido: el diagnóstico mostraba 'sin problemas' en JSONs con campos vacíos porque solo validaba tipos, no completitud" },
        { id: "b4", text: "Corregido: Aurora AI insertaba archivos adjuntos como texto en el campo de mensaje en vez de procesarlos internamente" },
      ],
      upcoming: [
        { id: "u1", text: "Editor visual de calendario de partidos (schedule) con soporte para playoffs y horarios" },
        { id: "u2", text: "Modo comparación mejorado que persiste al cambiar de sección y soporta archivos grandes sin truncamiento" },
        { id: "u3", text: "Panel de estadísticas avanzadas con gráficos interactivos de rendimiento de jugadores y equipos" },
      ],
    },
  ];
}

const ChangelogPanel = ({ onClose }: { onClose: () => void }) => {
  const [versions, setVersions] = useState<VersionEntry[]>(loadChangelog);
  const [activeTab, setActiveTab] = useState<"features" | "bugfixes" | "upcoming">("features");
  const [editMode, setEditMode] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(versions[0]?.id || null);

  useEffect(() => { saveChangelog(versions); }, [versions]);

  const addVersion = () => {
    const now = new Date();
    const date = `${now.getDate()} ${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][now.getMonth()]} ${now.getFullYear()}`;
    const v: VersionEntry = { id: crypto.randomUUID(), date, features: [], bugfixes: [], upcoming: [] };
    setVersions([v, ...versions]);
    setExpandedVersion(v.id);
  };

  const addEntry = (versionId: string, tab: "features" | "bugfixes" | "upcoming") => {
    setVersions(versions.map(v => v.id === versionId ? { ...v, [tab]: [...v[tab], { id: crypto.randomUUID(), text: "Nueva entrada — editar aquí" }] } : v));
  };

  const updateEntry = (versionId: string, tab: "features" | "bugfixes" | "upcoming", entryId: string, text: string) => {
    setVersions(versions.map(v => v.id === versionId ? { ...v, [tab]: v[tab].map(e => e.id === entryId ? { ...e, text } : e) } : v));
  };

  const deleteEntry = (versionId: string, tab: "features" | "bugfixes" | "upcoming", entryId: string) => {
    setVersions(versions.map(v => v.id === versionId ? { ...v, [tab]: v[tab].filter(e => e.id !== entryId) } : v));
  };

  const deleteVersion = (id: string) => {
    setVersions(versions.filter(v => v.id !== id));
  };

  const tabConfig = {
    features: { label: "Novedades", icon: <Sparkles className="w-4 h-4" />, color: "text-[#3FB950]", accentBg: "bg-[#3FB950]/10", border: "border-[#3FB950]/20" },
    bugfixes: { label: "Bugs Solucionados", icon: <Bug className="w-4 h-4" />, color: "text-[#58A6FF]", accentBg: "bg-[#58A6FF]/10", border: "border-[#58A6FF]/20" },
    upcoming: { label: "Próximamente", icon: <Rocket className="w-4 h-4" />, color: "text-purple-400", accentBg: "bg-purple-400/10", border: "border-purple-400/20" },
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-2xl max-h-[85vh] rounded-xl overflow-hidden flex flex-col shadow-2xl" style={{ background: "#0D1117", border: "1px solid #21262D" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #21262D" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "#58A6FF20" }}>
              <Sparkles className="w-5 h-5" style={{ color: "#58A6FF" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide" style={{ color: "#E6EDF3", fontFamily: "'Inter', sans-serif" }}>BBGM Editor — Novedades</h2>
              <p className="text-xs" style={{ color: "#8B949E" }}>Registro de cambios, correcciones y funciones próximas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="gap-1 text-xs"
              style={{ color: editMode ? "#3FB950" : "#8B949E" }}
            >
              {editMode ? <Save className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
              {editMode ? "Listo" : "Editar"}
            </Button>
            <button onClick={onClose} style={{ color: "#8B949E" }} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3" style={{ borderBottom: "1px solid #21262D" }}>
          {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors ${activeTab === tab ? "" : "hover:opacity-80"}`}
              style={{
                color: activeTab === tab ? (tab === "features" ? "#3FB950" : tab === "bugfixes" ? "#58A6FF" : "#A371F7") : "#8B949E",
                background: activeTab === tab ? "#161B22" : "transparent",
                borderBottom: activeTab === tab ? "2px solid " + (tab === "features" ? "#3FB950" : tab === "bugfixes" ? "#58A6FF" : "#A371F7") : "2px solid transparent",
              }}
            >
              {tabConfig[tab].icon} {tabConfig[tab].label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#21262D transparent" }}>
          {editMode && (
            <Button variant="outline" size="sm" onClick={addVersion} className="mb-4 gap-1 text-xs w-full" style={{ borderColor: "#21262D", color: "#8B949E" }}>
              <Plus className="w-3 h-3" /> Añadir versión
            </Button>
          )}

          {versions.map(version => (
            <div key={version.id} className="mb-6">
              <button
                onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                className="flex items-center gap-2 w-full mb-3"
              >
                {expandedVersion === version.id ? <ChevronDown className="w-4 h-4" style={{ color: "#8B949E" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#8B949E" }} />}
                <span className="text-sm font-semibold" style={{ color: "#E6EDF3" }}>{version.date}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#21262D", color: "#8B949E" }}>
                  {version[activeTab].length} {activeTab === "features" ? "novedad" : activeTab === "bugfixes" ? "corrección" : "planificada"}{version[activeTab].length !== 1 ? "es" : ""}
                </span>
                {editMode && (
                  <button onClick={e => { e.stopPropagation(); deleteVersion(version.id); }} className="ml-auto" style={{ color: "#F85149" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </button>

              {expandedVersion === version.id && (
                <div className="space-y-2 ml-6">
                  {version[activeTab].map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#161B22", border: "1px solid #21262D" }}>
                      <div className={`shrink-0 mt-0.5 ${tabConfig[activeTab].color}`}>
                        {tabConfig[activeTab].icon}
                      </div>
                      {editMode ? (
                        <div className="flex-1 flex gap-2">
                          <textarea
                            value={entry.text}
                            onChange={e => updateEntry(version.id, activeTab, entry.id, e.target.value)}
                            className="flex-1 bg-transparent border rounded px-2 py-1 text-xs resize-none min-h-[40px]"
                            style={{ borderColor: "#21262D", color: "#E6EDF3" }}
                          />
                          <button onClick={() => deleteEntry(version.id, activeTab, entry.id)} style={{ color: "#F85149" }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed" style={{ color: "#C9D1D9" }}>{entry.text}</p>
                      )}
                    </div>
                  ))}
                  {editMode && (
                    <Button variant="ghost" size="sm" onClick={() => addEntry(version.id, activeTab)} className="gap-1 text-xs w-full" style={{ color: "#8B949E", borderColor: "#21262D" }}>
                      <Plus className="w-3 h-3" /> Añadir entrada
                    </Button>
                  )}
                  {version[activeTab].length === 0 && !editMode && (
                    <p className="text-xs py-4 text-center" style={{ color: "#484F58" }}>Sin entradas en esta categoría</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogPanel;
