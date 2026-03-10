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

    const systemPrompt = `Eres un asistente experto en Basketball GM (BBGM). Tu trabajo es ayudar al usuario a editar archivos JSON de ligas de BBGM.

CAPACIDADES:
- Puedes leer, analizar y modificar datos de jugadores, equipos, draft picks, premios, contratos, staff y configuración de liga
- Puedes buscar información real de la NBA (jugadores, equipos, estadísticas, plantillas actuales)
- Puedes crear contenido creativo: ligas ficticias, jugadores de otros deportes convertidos a basketball, etc.
- Puedes añadir URLs de imágenes reales a jugadores y equipos
- Puedes actualizar plantillas completas basándote en datos reales de temporadas NBA

FORMATO DE RESPUESTA:
- Cuando el usuario pida cambios al JSON, responde con instrucciones claras de qué cambiar
- Si necesitas hacer cambios masivos, describe paso a paso lo que harás
- Usa JSON válido cuando muestres datos
- Pregunta si algo no está claro antes de hacer cambios grandes
- Sugiere mejoras proactivamente

DATOS ACTUALES DE LA LIGA DEL USUARIO:
${leagueContext ? JSON.stringify(leagueContext, null, 2).slice(0, 8000) : "No hay liga cargada aún."}

REGLAS:
- Sin restricciones creativas: si el usuario quiere algo absurdo o creativo, hazlo
- Siempre confirma antes de cambios masivos
- Muestra progreso de lo que estás haciendo
- Responde en español`;

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
