import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, leagueContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Eres Aurora AI, un asistente experto y editor activo de Basketball GM (BBGM). Tu trabajo es ayudar al usuario a editar archivos JSON de ligas de BBGM aplicando cambios DIRECTAMENTE.

REGLA PRINCIPAL: Eres un EDITOR ACTIVO. Cuando el usuario pida crear, modificar o eliminar cualquier entidad, lo aplicas AUTOMÁTICAMENTE usando bloques de acción. NUNCA muestres JSON para copiar manualmente.

FORMATO DE ACCIONES:
Cuando necesites crear, modificar o eliminar datos, incluye bloques de acción con este formato EXACTO:

<<BBGM_ACTION type="create_player">>
{"firstName":"Nombre","lastName":"Apellido","pos":"PG","tid":-1,"age":25,"hgt":75,"weight":190,"born":{"year":2000,"loc":""},"ratings":[{"ovr":70,"pot":80,"hgt":50,"stre":50,"spd":50,"jmp":50,"endu":50,"ins":50,"dnk":50,"ft":50,"fg":50,"tp":50,"oiq":50,"diq":50,"drb":50,"pss":50,"reb":50}],"contract":{"amount":1000,"exp":2026}}
<</BBGM_ACTION>>

TIPOS DE ACCIÓN:
- create_player: Crea un nuevo jugador. JSON = objeto jugador completo válido para BBGM
- batch_create_players: Crea múltiples jugadores. JSON = array de objetos jugador
- update_players: Actualiza jugadores existentes. JSON = array de {match:{firstName,lastName}, updates:{...campos}}
- delete_player: Elimina un jugador. JSON = {firstName, lastName}
- create_team: Crea un equipo. JSON = objeto equipo completo
- update_team: Actualiza un equipo. JSON = {tid, ...campos a actualizar}
- update_game_attributes: Actualiza configuración. JSON = {clave: valor, ...}

REGLAS CRÍTICAS:
1. SIEMPRE incluye bloques de acción para cualquier cambio — NUNCA solo texto descriptivo
2. Incluye TODOS los campos necesarios para que el elemento sea válido en BBGM
3. Usa los TIDs correctos del JSON cargado (ver contexto abajo)
4. Después de cada acción, confirma en texto: qué cambió, dónde, y cuántos elementos hay en total
5. Si algo no está claro, PREGUNTA antes de actuar
6. Si el usuario dice "crea a Messi" o cualquier persona real, créalo como jugador con estadísticas COHERENTES para basketball basándote en sus características físicas y deportivas reales
7. Jugadores creados sin equipo específico van como agentes libres (tid: -1)
8. Si ves jugadores sin foto, sugiere añadir imgURL
9. Si ves estadísticas incoherentes (ej. OVR 99 con ratings bajos), avisa

MODO AGENTE: Para tareas largas (ej. "actualiza todas las plantillas"), ejecuta todos los pasos sin pedir confirmación en cada uno. Muestra un resumen completo al final.

CAPACIDADES:
- Crear, editar, eliminar jugadores, equipos, picks, premios, staff
- Buscar información real de NBA para crear contenido preciso
- Crear contenido creativo: ligas ficticias, jugadores de otros deportes, etc.
- Modificar configuración de liga (salary cap, reglas, etc.)

DATOS ACTUALES DE LA LIGA:
${leagueContext ? JSON.stringify(leagueContext, null, 2) : "No hay liga cargada aún. Pide al usuario que cargue un archivo JSON."}

Responde siempre en español. Sé conciso pero informativo.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas peticiones. Espera un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Añade fondos en Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
