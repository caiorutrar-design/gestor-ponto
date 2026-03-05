import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin or super_admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { colaborador_id, password } = await req.json();

    if (!colaborador_id || !password) {
      return new Response(JSON.stringify({ error: "colaborador_id e password são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 8 caracteres." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get colaborador data
    const { data: colaborador, error: colabError } = await supabaseAdmin
      .from("colaboradores")
      .select("id, matricula, nome_completo, user_id")
      .eq("id", colaborador_id)
      .single();

    if (colabError || !colaborador) {
      return new Response(JSON.stringify({ error: "Colaborador não encontrado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If already has account, just reset password
    if (colaborador.user_id) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        colaborador.user_id,
        { password }
      );

      if (updateError) {
        return new Response(JSON.stringify({ error: "Erro ao atualizar senha: " + updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Audit log
      await supabaseAdmin.from("audit_logs").insert({
        user_id: callingUser.id,
        user_email: callingUser.email,
        action_type: "colaborador_password_reset",
        entity_type: "colaborador",
        entity_id: colaborador_id,
        details: { matricula: colaborador.matricula, nome: colaborador.nome_completo },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Senha atualizada com sucesso.",
          login: colaborador.matricula,
          is_reset: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new auth account using matricula as email
    const email = `${colaborador.matricula}@ponto.interno`;

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome_completo: colaborador.nome_completo, is_colaborador: true },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: "Erro ao criar conta: " + createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user!.id;

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ nome_completo: colaborador.nome_completo, email })
      .eq("user_id", userId);

    // Set role as 'user'
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "user" });

    // Link colaborador to auth user
    await supabaseAdmin
      .from("colaboradores")
      .update({ user_id: userId })
      .eq("id", colaborador_id);

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: callingUser.id,
      user_email: callingUser.email,
      action_type: "colaborador_account_created",
      entity_type: "colaborador",
      entity_id: colaborador_id,
      details: { matricula: colaborador.matricula, nome: colaborador.nome_completo, auth_user_id: userId },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conta criada com sucesso.",
        login: colaborador.matricula,
        is_reset: false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro interno do servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
