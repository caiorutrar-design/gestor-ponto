

# Plano: Melhorar Criacao de Conta de Colaborador

## Situacao Atual

A funcionalidade ja existe em grande parte:
- Edge function `create-colaborador-account` cria conta Auth, vincula `user_id`, define role `user`, e loga auditoria
- Frontend em `Colaboradores.tsx` tem dialog de credenciais com botao KeyRound
- Login ja suporta matricula@ponto.interno

## Problemas Identificados

1. **`supabase/config.toml` nao registra a edge function** -- falta `[functions.create-colaborador-account]`, o que pode impedir o deploy
2. **Geracao de senha fraca** -- usa `Math.random().toString(36).slice(-8) + "A1"` (previsivel, sem simbolos)
3. **Minimo de senha e 6** no edge function, usuario pediu 8
4. **Nenhuma opcao de criar conta automaticamente** ao cadastrar o colaborador (requer dois passos separados)

## Mudancas Propostas

### 1. Registrar edge function no config.toml
Adicionar `[functions.create-colaborador-account]` com `verify_jwt = false` (validacao e feita no codigo).

### 2. Gerar senha segura no frontend
Substituir `Math.random()` por `crypto.getRandomValues()` com charset incluindo letras maiusculas, minusculas, numeros e simbolos. Minimo 12 caracteres.

```typescript
function generateSecurePassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  // Garantir pelo menos 1 de cada tipo
  const ensure = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz', 
    '0123456789',
    '!@#$%&*'
  ];
  // substituir posicoes aleatorias se faltar algum tipo
  return password;
}
```

### 3. Atualizar validacao no edge function
Mudar minimo de 6 para 8 caracteres.

### 4. Adicionar checkbox no formulario de criacao
No dialog de "Novo Colaborador", adicionar checkbox "Criar conta de acesso automaticamente". Quando marcado, apos criar o colaborador com sucesso, chamar automaticamente `create-colaborador-account` e exibir as credenciais no dialog de resultado.

### 5. Melhorar dialog de credenciais
- Botao "Gerar Nova Senha" para regenerar antes de enviar
- Indicador visual se o colaborador ja tem conta (badge "Conta ativa" ou "Sem conta")
- Na listagem mobile (MobileCardList), adicionar botao de credenciais que esta faltando

## Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| `supabase/config.toml` | Adicionar registro da function |
| `supabase/functions/create-colaborador-account/index.ts` | Minimo 8 chars |
| `src/pages/Colaboradores.tsx` | Senha segura via crypto, checkbox auto-criar conta, botao credenciais no mobile |

## Sem Alteracoes

- Nenhuma tabela nova ou migracao necessaria (user_id ja existe em colaboradores)
- Login, MeuPonto, rotas protegidas e RLS permanecem intactos
- Edge function create-user nao e alterada

