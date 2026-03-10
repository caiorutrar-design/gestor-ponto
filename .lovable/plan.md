

# Plano: Melhorias de Documentacao, Validacao e CI

## Estado atual (ja existe)

- **RLS**: Todas as tabelas ja tem RLS com `has_role()` security definer
- **Senhas hashed**: Trigger `hash_senha_ponto` com bcrypt via pgcrypto
- **Rate limiting**: Ja implementado no endpoint de ponto
- **Estrutura de pastas**: Ja organizada (components/, pages/, hooks/, types/, contexts/, lib/)
- **Supabase client singleton**: Ja em `integrations/supabase/client.ts`
- **Vitest**: Ja configurado com setup file
- `.env` **nao esta no .gitignore** — precisa ser adicionado

## O que sera feito

### Prioridade Alta

| Arquivo | Acao |
|---|---|
| `README.md` | Reescrita completa com descricao, stack, setup, features, roadmap, contribuicao, licenca |
| `.env.example` | Criar com placeholders |
| `.gitignore` | Adicionar `.env` |
| `LICENSE` | Criar (MIT) |
| `src/pages/Login.tsx` | Adicionar validacao zod + react-hook-form |
| `src/pages/Cadastro.tsx` | Adicionar validacao zod + react-hook-form |

**Topicos no GitHub**: Nao e possivel via codigo — voce precisa adicionar manualmente em Settings > Topics no repositorio.

**Estrutura de pastas**: Ja esta organizada. Nao ha necessidade de mover arquivos.

### Prioridade Media

| Arquivo | Acao |
|---|---|
| `.github/workflows/ci.yml` | Criar com lint + vitest |
| `src/test/Login.test.tsx` | Teste unitario do form de login |
| `src/test/Cadastro.test.tsx` | Teste unitario do form de cadastro |

### Prioridade Baixa (apenas no README)

PWA e i18n serao listados como itens de roadmap no README em vez de implementados agora — adicionam complexidade sem beneficio imediato para o projeto atual.

### Detalhes de implementacao

**Validacao Zod (Login.tsx)**:
```typescript
const loginSchema = z.object({
  identifier: z.string().min(3, "Minimo 3 caracteres"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});
```

**Validacao Zod (Cadastro.tsx)**:
```typescript
const cadastroSchema = z.object({
  nome: z.string().min(3).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { path: ["confirmPassword"] });
```

**CI workflow**: Node 18, `npm ci`, `npx vitest run` em push e PR para main.

### Total: 8 arquivos criados/modificados

