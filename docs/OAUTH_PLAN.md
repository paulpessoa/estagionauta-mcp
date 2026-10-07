# Plano: OAuth no MCP do Estagionauta

**Objetivo:** permitir adicionar o MCP como conector no claude.ai (e em outros clientes MCP) com login normal do Estagionauta, sem o usuário copiar um JWT na mão.

## Como está hoje

- `src/worker.ts` lê `Authorization: Bearer <token>` e passa o token para `createServer`. As tools autenticadas usam esse token ou o argumento `token` (`src/lib/api-client.ts`, `requireToken`).
- O token é o access token do Supabase do usuário, validado pela API (`estagionauta-api` no Cloud Run).
- Funciona em Claude Desktop/Cursor com header fixo, mas o claude.ai exige o fluxo OAuth 2.1 do MCP (descoberta via `/.well-known/oauth-protected-resource`, registro dinâmico de cliente, PKCE).

## Desenho proposto

Antes de começar, avaliar a **opção A**. Se ela não servir, seguir com a **opção B**.

### Opção A: Supabase como servidor OAuth (mais simples, se disponível)

O Supabase Auth tem um modo de servidor OAuth 2.1. Se estiver disponível no projeto `ptogsfpkptzpuvdluxzf`:

1. Ativar o servidor OAuth no dashboard do Supabase (Authentication).
2. O Worker só publica `/.well-known/oauth-protected-resource` apontando para o Supabase e responde `401` com `WWW-Authenticate` quando falta token.
3. A tela de consentimento fica no front (`/oauth/consent`), usando a sessão do Supabase.
4. O token que chega no Worker continua sendo um JWT do Supabase, então `api-client.ts` não muda.

Não precisa de KV.

### Opção B: `@cloudflare/workers-oauth-provider` no Worker

1. O Worker vira o servidor OAuth (`/authorize`, `/token`, `/register`) com `OAuthProvider`, guardando grants num KV `OAUTH_KV`.
2. `/authorize` redireciona para uma página nova no front, `estagionauta.com.br/mcp/autorizar?...`, que faz login com Supabase e devolve o access token para um callback do Worker.
3. O Worker conclui a autorização com `props: { supabaseToken }`, e as tools recebem esse token como hoje.
4. **Refresh:** o access token do Supabase expira em 1 hora. Guardar também o refresh token nas props e renovar quando a API responder 401.

## Requisitos (valem para as duas opções)

- **Compatibilidade:** o header `Authorization: Bearer <jwt do Supabase>` e o argumento `token` continuam funcionando (Claude Desktop, Cursor, stdio com `ESTAGIONAUTA_TOKEN`).
- **Tools públicas** (`calculate-recess`, `search-agencies`, `get-agency-details`) continuam sem login.
- **Testes (vitest):** descoberta (`/.well-known/...`), 401 sem token, header legado aceito e token OAuth repassado às tools. A API fica mockada.
- **Teste manual:** adicionar a URL `https://estagionauta-mcp.paulmspessoa.workers.dev/mcp` como conector no claude.ai, logar e chamar `check-credits`.

## Tarefas do Paul (infra)

- **Opção A:** ativar o servidor OAuth no Supabase e cadastrar as URLs de redirect que o código pedir.
- **Opção B:** `npx wrangler kv namespace create OAUTH_KV` e colar o id no `wrangler.toml`. Se o callback precisar de segredo, `npx wrangler secret put ...`.

## Estado geral em 07/10/2026 (para retomar)

Feito:

- Migrations aplicadas em produção, com os 12 cupons de Recife. O resgate por link `?cupom=` foi testado e funciona.
- PRs mergeados: `estagionauta` #2 e #3, `estagionauta-mcp` #1 (deploy no Cloudflare ok).
- Chave BYOK rotacionada. O Cloud Run tem `BYOK_ENCRYPTION_KEY` própria, com 64 caracteres.
- Brevo: domínio `estagionauta.com.br` autenticado (DKIM/DMARC), remetente `contato@estagionauta.com.br` ativo, template 6 usando esse remetente.
- Chave do Google Maps: não precisa trocar, porque já está restrita ao domínio e às APIs de mapas.

Pendente:

- Este OAuth.
- 18 warnings de `react-hooks/exhaustive-deps` no front, que precisam ser testados página por página. `Sucesso.tsx` mexe com créditos, então tomar cuidado.
- Incremento de `coupons.used_count` não é atômico (`api/src/tools/redeem_coupon.ts`). Trocar por um RPC com `UPDATE ... SET used_count = used_count + 1 WHERE used_count < max_uses`.
- Opcional: redirecionar `contato@estagionauta.com.br` para o Gmail (o DNS está na Vercel e não há MX).
