import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting (per isolate instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { matricula, senha_ponto } = await req.json();

    if (!matricula || !senha_ponto) {
      return new Response(
        JSON.stringify({ error: "Matrícula e senha são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit by IP + matricula
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitKey = `${ip}:${matricula}`;

    if (isRateLimited(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde um minuto e tente novamente." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate credentials using pgcrypto crypt() comparison
    const { data: colaborador, error: colabError } = await supabaseAdmin
      .rpc("validate_senha_ponto", {
        _matricula: matricula,
        _senha_ponto: senha_ponto,
      });

    if (colabError || !colaborador || colaborador.length === 0) {
      // Log failed attempt
      await supabaseAdmin.from("audit_logs").insert({
        action_type: "login_failed",
        entity_type: "registro_ponto",
        details: { matricula, ip, reason: "invalid_credentials" },
      });

      return new Response(
        JSON.stringify({ error: "Matrícula ou senha inválidas." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const colab = colaborador[0];

    // Check today's records count
    const today = new Date().toISOString().split("T")[0];
    const { data: todayRecords, error: recordsError } = await supabaseAdmin
      .from("registros_ponto")
      .select("id, tipo, timestamp_registro")
      .eq("colaborador_id", colab.id)
      .eq("data_registro", today)
      .order("timestamp_registro", { ascending: true });

    if (recordsError) throw recordsError;

    if (todayRecords && todayRecords.length >= 4) {
      return new Response(
        JSON.stringify({ error: "Limite de 4 registros por dia atingido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine type: alternate between entrada/saida
    const lastRecord = todayRecords && todayRecords.length > 0
      ? todayRecords[todayRecords.length - 1]
      : null;
    const tipo = !lastRecord || lastRecord.tipo === "saida" ? "entrada" : "saida";

    const now = new Date();

    // Insert record
    const { data: registro, error: insertError } = await supabaseAdmin
      .from("registros_ponto")
      .insert({
        colaborador_id: colab.id,
        data_registro: today,
        hora_registro: now.toTimeString().split(" ")[0],
        timestamp_registro: now.toISOString(),
        tipo,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ponto registrado com sucesso às ${now.toLocaleTimeString("pt-BR")} em ${now.toLocaleDateString("pt-BR")}`,
        registro: {
          ...registro,
          colaborador_nome: colab.nome_completo,
        },
        tipo,
        registros_hoje: (todayRecords?.length || 0) + 1,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro interno ao registrar ponto." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
