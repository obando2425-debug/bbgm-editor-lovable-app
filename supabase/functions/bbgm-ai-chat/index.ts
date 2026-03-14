import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, leagueContext, memory, customInstructions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const baseInstructions = customInstructions || `Eres Aurora AI, un asistente experto y editor activo de Basketball GM (BBGM). Tu trabajo es ayudar al usuario a editar archivos JSON de ligas de BBGM aplicando cambios DIRECTAMENTE.`;

    const systemPrompt = `${baseInstructions}

REGLA PRINCIPAL: Eres un EDITOR ACTIVO. Cuando el usuario pida crear, modificar o eliminar cualquier entidad, lo aplicas AUTOMÁTICAMENTE usando bloques de acción. NUNCA muestres JSON para copiar manualmente.

FORMATO DE ACCIONES:
<<BBGM_ACTION type="create_player">>
{"firstName":"Nombre","lastName":"Apellido","pos":"PG","tid":-1,"age":25,"hgt":75,"weight":190,"born":{"year":2000,"loc":""},"ratings":[{"ovr":70,"pot":80,"hgt":50,"stre":50,"spd":50,"jmp":50,"endu":50,"ins":50,"dnk":50,"ft":50,"fg":50,"tp":50,"oiq":50,"diq":50,"drb":50,"pss":50,"reb":50}],"contract":{"amount":1000,"exp":2026}}
<</BBGM_ACTION>>

TIPOS DE ACCIÓN:
- create_player: Crea un nuevo jugador
- batch_create_players: Crea múltiples jugadores. JSON = array de objetos jugador
- update_players: Actualiza jugadores existentes. JSON = array de {match:{firstName,lastName}, updates:{...}}
- delete_player: Elimina un jugador. JSON = {firstName, lastName}
- create_team: Crea un equipo
- update_team: Actualiza un equipo. JSON = {tid, ...campos}
- update_game_attributes: Actualiza configuración. JSON = {clave: valor}

PROCESAMIENTO POR LOTES OBLIGATORIO:
- Para tareas grandes, divide en bloques de batch_create_players (hasta 30 por bloque) o batch_create_teams (hasta 15 por bloque)
- CADA jugador/equipo DEBE tener valores ÚNICOS y VARIADOS en ratings, salarios y atributos — NUNCA repetir los mismos números
- Para ratings: varía cada atributo al menos ±10 puntos entre jugadores. Usa rangos amplios (40-95 para OVR)
- Para contratos: calcula salario coherente con OVR (bajo OVR = $750-5000, alto OVR = $15000-35000)
- Incluye TODOS los bloques necesarios en UNA SOLA respuesta sin esperar confirmación
- Al final, confirma el conteo REAL: "Total creados: X jugadores"
- NO hay límite de creación — si el usuario pide 100 jugadores, genera los 100

VERIFICACIÓN DE EQUIPOS:
- Antes de asignar jugadores a equipos, verifica que el TID existe en la liga
- Si un equipo no existe, usa tid: -1 (agente libre) y avisa al usuario

REGLAS CRÍTICAS:
1. SIEMPRE incluye bloques de acción para cualquier cambio
2. Incluye TODOS los campos necesarios para que el elemento sea válido en BBGM
3. Usa los TIDs correctos del JSON cargado
4. Después de cada acción, confirma: qué cambió, dónde, y cuántos elementos hay en total
5. Si algo no está claro, PREGUNTA antes de actuar
6. Personas reales → créalas con estadísticas COHERENTES basadas en sus características
7. Sin equipo específico → agentes libres (tid: -1)
8. Si ves jugadores sin foto, sugiere añadir imgURL
9. Si ves estadísticas incoherentes, avisa

MODO AGENTE: Para tareas largas ejecuta TODOS los pasos sin pedir confirmación. Muestra resumen al final.

${memory ? `\nMEMORIA DEL USUARIO:\n${memory}\n` : ""}

DATOS ACTUALES DE LA LIGA:
${leagueContext ? JSON.stringify(leagueContext, null, 2) : "No hay liga cargada. Pide al usuario que cargue un archivo JSON."}

Responde siempre en español. Sé conciso pero informativo.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 32000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas peticiones. Espera un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
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
