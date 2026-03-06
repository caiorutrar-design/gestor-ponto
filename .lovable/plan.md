

# Plano: Corrigir Login + Jornada Livre

## Parte 1: Corrigir Erro de Credenciais

**Diagnostico:** A edge function `create-colaborador-account` usa `supabase.auth.admin.createUser()` com `email_confirm: true`, o que esta correto. O login em `Login.tsx` converte matricula para `{matricula}@ponto.interno` e chama `signInWithPassword`. O fluxo esta correto em teoria.

**Problema provavel:** O `config.toml` ja registra a function, mas com `verify_jwt = false`. A function valida o caller internamente usando `SUPABASE_PUBLISHABLE_KEY` (anon key) para criar o client autenticado -- isso esta correto. Porem, se o admin nao esta logado ao chamar a function, o `getUser()` falha silenciosamente. Vou adicionar logs na edge function para diagnostico e garantir que o fluxo complete sem erros.

**Acoes:**
1. **Edge function `create-colaborador-account`**: Adicionar logging detalhado para cada etapa (auth user creation, profile update, role insert, colaborador link). Garantir que erros em etapas secundarias (profile, role) nao passem silenciosos.
2. **Verificar se `email_confirm: true`** esta funcionando -- o user precisa ter email confirmado para logar.
3. **Login.tsx**: Adicionar feedback mais especifico quando credenciais falham com matricula (ex: "Verifique se sua conta foi criada pelo administrador").

## Parte 2: Jornada Livre (Acordo Coletivo)

**Mudancas necessarias:**

### Edge Function `registrar-ponto`
- **Remover limite de 4 registros/dia** (linha 89: `todayRecords.length >= 4`)
- Substituir por limite mais alto (ex: 20) como safety net contra abuso
- Manter alternancia entrada/saida

### Frontend `MeuPonto.tsx`
- **Remover limite de 4** (linhas 93, 183, 199)
- **Remover barra de 8h fixa** -- substituir por calculo dinamico de horas trabalhadas sem meta fixa, ou tornar a meta configuravel
- **Adicionar tipo "pausa"**: alem de entrada/saida, permitir registrar pausas (lanche 15min, almoco 1h, jantar 1h)
- Adicionar card mostrando pausas do dia com duracao

### Frontend `RegistroPonto.tsx` (kiosk)
- Sem mudancas estruturais -- o kiosk ja e flexivel, apenas remover o limite de 4 no backend

### Hook `useRegistrosPonto`
- Sem validacoes rigidas de turno a remover -- o hook apenas busca dados

### Database
- Nenhuma migracao necessaria -- o campo `tipo` em `registros_ponto` ja e `text`, pode aceitar "pausa_inicio" e "pausa_fim"

### Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/registrar-ponto/index.ts` | Remover limite 4, aceitar tipos pausa |
| `supabase/functions/create-colaborador-account/index.ts` | Adicionar logs detalhados |
| `src/pages/MeuPonto.tsx` | Remover limite 4, adicionar botoes de pausa, calculo flexivel |
| `src/pages/Login.tsx` | Melhorar mensagens de erro para matricula |

### Sem alteracoes
- Triggers `hash_senha_ponto` e `validate_senha_ponto` permanecem intactos
- RLS policies inalteradas
- `RegistroPonto.tsx` sem mudancas (kiosk ja e simples)
- `useRegistrosPonto.ts` sem mudancas

