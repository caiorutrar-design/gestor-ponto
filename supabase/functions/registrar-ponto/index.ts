import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Validate credentials
    const { data: colaborador, error: colabError } = await supabaseAdmin
      .from("colaboradores")
      .select("id, nome_completo, matricula, ativo")
      .eq("matricula", matricula)
      .eq("senha_ponto", senha_ponto)
      .eq("ativo", true)
      .maybeSingle();

    if (colabError || !colaborador) {
      return new Response(
        JSON.stringify({ error: "Matrícula ou senha inválidas." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check today's records count
    const today = new Date().toISOString().split("T")[0];
    const { data: todayRecords, error: recordsError } = await supabaseAdmin
      .from("registros_ponto")
      .select("id, tipo, timestamp_registro")
      .eq("colaborador_id", colaborador.id)
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
        colaborador_id: colaborador.id,
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
          colaborador_nome: colaborador.nome_completo,
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
