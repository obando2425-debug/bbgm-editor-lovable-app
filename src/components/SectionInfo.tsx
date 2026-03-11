import React, { useState } from "react";
import { Info, X } from "lucide-react";

const SECTION_HELP: Record<string, { title: string; content: string }> = {
  players: {
    title: "Jugadores",
    content: "Gestiona todos los jugadores de la liga. Puedes buscar, filtrar por equipo o posición, arrastrar para reordenar, y editar cada jugador individualmente. Los campos incluyen datos personales, contrato, ratings y estadísticas. Usa el botón '+' para crear jugadores nuevos o importar desde JSON."
  },
  teams: {
    title: "Equipos",
    content: "Administra los equipos de la liga. Cada equipo tiene región, nombre, abreviatura, conferencia, división y colores. Puedes ver el roster completo de cada equipo, añadir jugadores o editar la información del equipo."
  },
  draft: {
    title: "Draft",
    content: "Gestiona los picks del draft. Cada pick tiene temporada, ronda, equipo asignado y equipo original (para picks tradeados). Puedes añadir, eliminar o modificar picks."
  },
  contracts: {
    title: "Contratos",
    content: "Visualiza y edita los contratos de todos los jugadores. Muestra salario, año de expiración, equipo y ratings. Usa 'Sincronizar' para generar contratos para jugadores que no tengan uno."
  },
  awards: {
    title: "Premios",
    content: "Gestiona los premios de la liga por temporada: MVP, DPOY, ROY, Finals MVP, All-Star y más. Puedes crear, duplicar, editar o eliminar premios."
  },
  trades: {
    title: "Trades",
    content: "Visualiza el historial de trades y crea nuevos intercambios entre equipos. Selecciona dos equipos, elige los jugadores y ejecuta el trade."
  },
  seasons: {
    title: "Historial de Temporadas",
    content: "Explora el historial completo de la liga por temporada. Muestra eventos, premios, campeones y datos destacados de cada año."
  },
  settings: {
    title: "Configuración",
    content: "Edita todos los atributos de la liga organizados por categorías: Liga, Juego, Equipos, Jugadores, Finanzas y Otros. Incluye reglas de playoffs, retos, tasas y configuración avanzada de Basketball GM."
  },
  finances: {
    title: "Finanzas",
    content: "Gestiona la economía completa de la liga. 'Finanzas de Liga' muestra los límites salariales y una tabla comparativa de todos los equipos. 'Finanzas por Equipo' permite editar presupuestos (Scouting, Coaching, Salud, Instalaciones), nómina detallada y estrategia."
  },
  compare: {
    title: "Comparar JSONs",
    content: "Compara el JSON principal con archivos de referencia cargados. Útil para identificar diferencias entre versiones de una liga."
  },
  history: {
    title: "Historial de Cambios",
    content: "Registro de todas las modificaciones realizadas. Cada entrada se expande para mostrar valores anteriores y nuevos. Puedes deshacer cambios individuales, filtrar por categoría o exportar el historial."
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
