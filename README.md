# 🎓 estagionauta-mcp

> MCP Server for [Estagionauta](https://estagionauta.com.br) — AI-powered internship tools for Brazilian students.

[![npm](https://img.shields.io/npm/v/estagionauta-mcp)](https://www.npmjs.com/package/estagionauta-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

Connect your AI assistant (Claude, Gemini, Cursor, Windsurf, or any MCP-compatible client) to **Estagionauta** — a platform that helps Brazilian students land their first internship.

You can connect **remotely** (hosted on Cloudflare Workers, HTTP transport, no install) or **locally** (stdio via `npx`).

## ✨ Tools

7 tools (no resources or prompts). Three are public, four need your Estagionauta token.

| Tool | What it does | Main params | Auth |
|:-----|:-------------|:------------|:-----|
| `calculate_recess` | Internship recess (vacation) days and proportional pay under Lei nº 11.788/2008. Runs locally, no API call. | `startDate`, `endDate?`, `salary` | No |
| `search_agencies` | Search approved internship agencies (CIEE, NUBE, IEL, etc.). | `query?`, `state?`, `city?`, `agencyType?` | No |
| `get_agency_details` | Details and student reviews for one agency (ID from `search_agencies`). | `agencyId` | No |
| `check_credits` | Credit balance, subscription status and recent transactions. | `token?` | Yes |
| `redeem_coupon` | Redeem a promotional coupon for credits. | `code`, `token?` | Yes |
| `check_candidatures` | List your active applications (candidaturas) from the Kanban board. | `token?` | Yes |
| `candidatura_stats` | Metrics and statistics from your Kanban board. | `token?` | Yes |

> [!NOTE]  
> **Authentication:** Tools that require authentication (`Auth Required: Yes`) expect your Estagionauta Access Token (JWT). You can easily copy this token in your browser by logging into [estagionauta.com.br](https://estagionauta.com.br), heading to **Configurações da Conta** (Account Settings), and clicking "Copiar Token".
>
> To avoid pasting the token into the chat, send it once per connection instead — the `token` argument then becomes optional:
> - **Remote:** `claude mcp add --transport http estagionauta-mcp https://estagionauta-mcp.paulmspessoa.workers.dev/mcp --header "Authorization: Bearer <TOKEN>"`
> - **Local (stdio):** set the `ESTAGIONAUTA_TOKEN` environment variable (e.g. `"env": { "ESTAGIONAUTA_TOKEN": "<TOKEN>" }` in `claude_desktop_config.json`).
>
> Note: the token expires (Supabase JWT, ~1h). Proper OAuth login is on the roadmap.

## 🚀 Connect it

### Method A: Remote (hosted on Cloudflare Workers), recommended

Endpoint: `https://estagionauta-mcp.paulmspessoa.workers.dev/mcp`

#### Claude Code
```bash
claude mcp add --transport http estagionauta-mcp https://estagionauta-mcp.paulmspessoa.workers.dev/mcp
```

#### Claude Desktop
Add this to your `claude_desktop_config.json` (if your version does not accept `url` directly, bridge it with `npx -y mcp-remote <endpoint>`):
```json
{
  "mcpServers": {
    "estagionauta-mcp": {
      "url": "https://estagionauta-mcp.paulmspessoa.workers.dev/mcp"
    }
  }
}
```

#### Cursor
Add this to `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):
```json
{
  "mcpServers": {
    "estagionauta": {
      "url": "https://estagionauta-mcp.paulmspessoa.workers.dev/mcp"
    }
  }
}
```

---

### Method B: Local execution (via npm/npx)

#### Claude Desktop (Local)
Add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "estagionauta-local": {
      "command": "npx",
      "args": ["-y", "estagionauta-mcp"]
    }
  }
}
```

#### Cursor
Go to **Settings → Features → MCP**, click **Add New MCP Server** and enter:
- **Name:** `estagionauta`
- **Type:** `command`
- **Command:** `npx -y estagionauta-mcp`

## 💬 Example Prompts

Once connected, try asking your AI:

- *"Calculate my internship recess. I started on 2025-01-15 and my salary is R$1200"*
- *"Search for internship agencies in Pernambuco"*
- *"Find CIEE agency details and student reviews"*
- *"What agencies are available in São Paulo for consulting?"*
- *"How many vacation days do I get after 8 months of internship?"*

## 🏗️ Architecture

```
AI Client (Claude/Gemini/Cursor)
  ↓ MCP Protocol (JSON-RPC)
estagionauta-mcp (this server)
  ↓ HTTP (server-to-server)
Estagionauta API (Hono.js on Cloud Run)
  ↓ SQL
Supabase (PostgreSQL)
```

`src/server.ts` builds a single `McpServer` (official TypeScript SDK, tools validated with Zod) that has two entry points: `src/index.ts` (stdio, for `npx`) and `src/worker.ts` (Cloudflare Workers, using `createMcpHandler` from the `agents` package). The Worker creates a fresh server per request and forwards the caller's `Authorization: Bearer` token to the authenticated tools. The server **never** accesses the database directly: all data flows through the Estagionauta API, which handles authentication, rate limiting, and data validation. Pushes to `main` run build + tests and deploy via GitHub Actions. OAuth login for claude.ai is planned (see [docs/OAUTH_PLAN.md](docs/OAUTH_PLAN.md)).

## 🛠️ Development

```bash
git clone https://github.com/paulpessoa/estagionauta-mcp.git
cd estagionauta-mcp
npm install

npm run build       # compile TypeScript
npm test            # run tests (Vitest)
npm run inspector   # test the stdio server with MCP Inspector
npx wrangler dev    # run the Worker locally (endpoint at /mcp)
npm run deploy      # deploy to Cloudflare Workers (needs wrangler login)
```

### Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `ESTAGIONAUTA_API_URL` | `https://estagionauta-api-991344207740.southamerica-east1.run.app` | Estagionauta API base URL |

## 🌐 Compatible Clients

Works with any AI client that supports the [Model Context Protocol](https://modelcontextprotocol.io):

- ✅ Claude Desktop & Claude Code
- ✅ Gemini CLI & Agent Dev Kit
- ✅ Cursor
- ✅ Windsurf
- ✅ Cline
- ✅ Continue
- ✅ Zed
- ✅ Cherry Studio
- ✅ LibreChat
- ✅ Any MCP-compatible client

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

## 👤 Author

**Paul Pessoa** — [GitHub](https://github.com/paulpessoa) · [LinkedIn](https://linkedin.com/in/paulmspessoa)

Built with ❤️ to help Brazilian students land their first internship.
