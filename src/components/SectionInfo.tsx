import React, { useState } from "react";
import { Info, X } from "lucide-react";

const SECTION_HELP: Record<string, { title: string; content: string }> = {
  players: {
    title: "Jugadores",
    content: "Gestiona todos los jugadores de la liga. Puedes buscar, filtrar por equipo o posición, arrastrar para reordenar, y editar cada jugador individualmente. Los campos incluyen datos personales, contrato, ratings y estadísticas. Usa el botón '+' para crear jugadores nuevos o importar desde JSON."
  },
  teams: {
    title: "Equipos",
    content: "Administra los equipos de la liga. Cada equipo tiene región, nombre, abreviatura, conferencia, división y colores. Puedes ver el roster completo de cada equipo, añadir jugadores o editar la información del equipo. Los cambios se reflejan automáticamente en las demás secciones."
  },
  draft: {
    title: "Draft",
    content: "Gestiona los picks del draft. Cada pick tiene temporada, ronda, equipo asignado y equipo original (para picks tradeados). Puedes añadir, eliminar o modificar picks. Los picks se usan en la simulación de Basketball GM para asignar nuevos jugadores."
  },
  contracts: {
    title: "Contratos",
    content: "Visualiza y edita los contratos de todos los jugadores activos. Muestra salario (en $K), año de expiración, equipo y ratings. Filtra por equipo para ver la masa salarial total. Haz clic en cualquier fila para editar el contrato completo."
  },
  awards: {
    title: "Premios",
    content: "Gestiona los premios y reconocimientos de la liga por temporada: MVP, DPOY, ROY, Finals MVP, All-Star selections y más. Puedes crear, duplicar, editar o eliminar premios. Filtra por temporada para ver los premios de un año específico."
  },
  staff: {
    title: "Staff Técnico",
    content: "Administra el cuerpo técnico de cada equipo. Basketball GM soporta coaches con atributos como estrategia ofensiva/defensiva. Si tu JSON no incluye staff, puedes crear uno desde cero. Los coaches afectan el rendimiento de los equipos en la simulación."
  },
  trades: {
    title: "Trades",
    content: "Visualiza el historial de trades registrados en los eventos de la liga y crea nuevos intercambios entre equipos. Selecciona dos equipos, elige los jugadores a intercambiar y ejecuta el trade. Los cambios se aplican automáticamente a los rosters."
  },
  seasons: {
    title: "Historial de Temporadas",
    content: "Explora el historial completo de la liga por temporada. Muestra eventos, premios, campeones y datos destacados de cada año. Haz clic en una temporada para ver todos los detalles y exportar la información como JSON."
  },
  settings: {
    title: "Configuración",
    content: "Edita todos los atributos de la liga: nombre, temporada, salary cap, luxury tax, número de partidos, reglas de playoffs y más. Los valores simples se editan directamente; los objetos complejos se editan como JSON. Estos valores controlan las reglas de simulación en Basketball GM."
  },
  finances: {
    title: "Finanzas de Liga",
    content: "Gestiona la economía de la liga: salary cap, payroll mínimo, luxury tax e ingresos. Visualiza la masa salarial de cada equipo con indicadores de estado (sobre el cap, en luxury tax). Edita los parámetros financieros que afectan los contratos y la competitividad."
  },
  compare: {
    title: "Comparar JSONs",
    content: "Compara el JSON principal con archivos de referencia cargados. Útil para identificar diferencias entre versiones de una liga, verificar cambios realizados o fusionar datos de distintas fuentes."
  },
  history: {
    title: "Historial de Cambios",
    content: "Registro completo de todas las modificaciones realizadas en la sesión. Cada entrada muestra la sección, descripción, hora y valores anteriores/nuevos. Puedes deshacer cambios individuales, filtrar por categoría o exportar el historial completo como JSON."
  },
};

const SectionInfo = ({ section }: { section: string }) => {
  const [open, setOpen] = useState(false);
  const help = SECTION_HELP[section];
  if (!help) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors"
        title={`Info: ${help.title}`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Info className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-display text-lg tracking-wider text-primary">{help.title}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{help.content}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default SectionInfo;
