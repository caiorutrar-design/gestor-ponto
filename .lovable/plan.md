

# Plano: Geolocalização para Registro de Ponto

## Problema

Colaboradores trabalham em unidades espalhadas pelo Maranhão e outros estados. Como o sistema é online, qualquer pessoa com matrícula e senha pode bater ponto de qualquer lugar, sem estar fisicamente na unidade.

## Solução proposta

### Modelo de dados

**Nova tabela `unidades_trabalho`** — cadastro de locais de trabalho com coordenadas:

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid | PK |
| nome | text | Ex: "Sede São Luís", "Unidade Imperatriz" |
| latitude | double precision | Coordenada central |
| longitude | double precision | Coordenada central |
| raio_metros | integer | Raio permitido (default 200m) |
| orgao_id | uuid | FK para orgaos |
| ativo | boolean | Default true |

**Alterações na tabela `colaboradores`**:
- `unidade_trabalho_id` (uuid, nullable) — FK para unidades_trabalho
- `geolocation_obrigatoria` (boolean, default false) — se o admin ativou validação geo para este colaborador

**Alterações na tabela `registros_ponto`**:
- `latitude` (double precision, nullable) — coordenada capturada no momento
- `longitude` (double precision, nullable) — coordenada capturada no momento
- `dentro_raio` (boolean, nullable) — resultado da validação

### Fluxo

```text
Admin cadastra Unidade de Trabalho (nome, endereço, lat/lng, raio)
  → Vincula colaborador à unidade + ativa "geolocalização obrigatória"

Colaborador bate ponto:
  → Frontend captura navigator.geolocation
  → Envia lat/lng junto com matrícula e senha
  → Edge Function valida:
     - Se colaborador tem geo obrigatória → calcula distância
     - Se dentro do raio → registra normalmente
     - Se fora do raio → rejeita com mensagem clara
     - Se geo não obrigatória → registra sem validação
  → Coordenadas são salvas no registro para auditoria
```

### Cálculo de distância (Haversine)

A Edge Function usará a fórmula de Haversine para calcular a distância entre o ponto do colaborador e o centro da unidade. Precisão suficiente para raios de 100-500m.

### Páginas e UI

1. **Nova página "Unidades de Trabalho"** (admin) — CRUD de unidades com mapa visual (opcional) ou campos lat/lng + raio
2. **Formulário de Colaborador** — novo campo select "Unidade de Trabalho" + toggle "Exigir geolocalização"
3. **Página Registro de Ponto** — solicitar permissão de localização ao carregar; mostrar status (localização obtida / não disponível)
4. **Página Meu Ponto** — mesmo tratamento de geolocalização
5. **Gerenciar Pontos** — coluna indicando se registro foi dentro/fora do raio

### Segurança

- Validação acontece no **servidor** (Edge Function) — o frontend envia coordenadas mas a decisão é do backend
- Coordenadas são registradas para **auditoria** mesmo quando geo não é obrigatória
- Admin pode desativar geo por colaborador (trabalho externo, home office temporário)
- RLS nas unidades_trabalho seguindo mesmo padrão das outras tabelas

### Arquivos criados/modificados

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabela `unidades_trabalho`, adicionar colunas em `colaboradores` e `registros_ponto` |
| `src/pages/UnidadesTrabalho.tsx` | Nova página CRUD de unidades |
| `src/hooks/useUnidadesTrabalho.ts` | Hook para CRUD |
| `src/hooks/useGeolocation.ts` | Hook para capturar posição do navegador |
| `src/pages/Colaboradores.tsx` | Adicionar campos unidade + toggle geo |
| `src/pages/RegistroPonto.tsx` | Capturar e enviar coordenadas |
| `src/pages/MeuPonto.tsx` | Capturar e enviar coordenadas |
| `supabase/functions/registrar-ponto/index.ts` | Validar distância com Haversine |
| `src/App.tsx` | Adicionar rota /unidades-trabalho |
| `src/components/layout/AppLayout.tsx` | Adicionar link no menu |

### Limitações conhecidas

- GPS do navegador tem precisão de 10-50m (suficiente para raios de 100m+)
- Colaborador pode negar permissão de localização — se geo é obrigatória, o ponto é bloqueado com mensagem orientando ativar
- VPN/GPS spoofing é possível mas requer esforço técnico significativo — mitigado pelo registro de coordenadas para auditoria

