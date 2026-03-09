

# Plano: Admin define a senha no cadastro + Diagnóstico do erro de login

## Diagnóstico

O erro "Matrícula ou senha incorreta" no login pode ter duas causas:

1. **Edge function não deployada** — os logs estão vazios, o que indica que a function pode não estar deployada ou nunca foi chamada com sucesso. Preciso deployar a function.

2. **Fluxo de auto-criação usa senha gerada que o admin pode não ter anotado** — a senha é gerada automaticamente e exibida no modal, mas se o admin fechou sem anotar, perdeu.

## Solução: Admin define a senha no formulário de cadastro

Substituir a geração automática por um campo de senha no próprio formulário de "Novo Colaborador" quando a checkbox "Criar conta de acesso" estiver marcada. O admin digita a senha que quer dar ao colaborador.

### Mudanças

**`src/pages/Colaboradores.tsx`**:
- Adicionar campo `senha` ao formulário (visível apenas quando `autoCreateAccount` está marcado e não é edição)
- Manter botão de gerar senha aleatória ao lado do campo (ícone RefreshCw) para conveniência
- No `handleSubmit`, usar a senha digitada pelo admin em vez de gerar automaticamente
- Validar mínimo de 8 caracteres antes de enviar

**Deploy da edge function**:
- Deployar `create-colaborador-account` para garantir que está ativa

### Fluxo resultante

```text
Admin abre "Novo Colaborador"
  → Preenche dados + marca "Criar conta"
  → Digita senha OU clica no botão gerar
  → Clica "Cadastrar"
  → Sistema cria colaborador + conta Auth
  → Modal confirma: "Login: 125240 / Senha: [a que ele digitou]"
  → Admin repassa ao colaborador
  → Colaborador loga com matrícula + senha definida
```

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/Colaboradores.tsx` | Adicionar campo senha no form, usar senha do admin no auto-create |

### Sem alterações
- Edge function permanece igual (já aceita password no body)
- Login.tsx sem mudanças
- Triggers e RLS inalterados

