# 🎓 estagionauta-mcp

> MCP Server for [Estagionauta](https://estagionauta.com.br) — AI-powered internship tools for Brazilian students.

[![npm](https://img.shields.io/npm/v/estagionauta-mcp)](https://www.npmjs.com/package/estagionauta-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

Connect your AI assistant (Claude, Gemini, Cursor, Windsurf, or any MCP-compatible client) to **Estagionauta** — a platform that helps Brazilian students land their first internship.

You can connect to this server either **locally** (via command/stdio) or **remotely** (via Server-Sent Events (SSE) hosted on Cloudflare Workers).

## ✨ Available Tools

| Tool | Description | Auth Required |
|:-----|:------------|:--------------|
| `calculate_recess` | Calculate internship recess (vacation) days and payment based on Brazilian Internship Law (Lei nº 11.788/2008) | ❌ No |
| `search_agencies` | Search approved internship agencies (CIEE, NUBE, IEL, etc.) by state, city, type, or name | ❌ No |
| `get_agency_details` | Get detailed info and student reviews for a specific agency | ❌ No |
| `check_credits` | Check your Estagionauta credit balance and subscription status | 🔑 Yes |
| `redeem_coupon` | Redeem a promotional credit coupon on Estagionauta | 🔑 Yes |
| `check_candidatures` | List your active internship applications (candidaturas) on your Kanban board | 🔑 Yes |
| `candidatura_stats` | Get general metrics and statistics from your Kanban board | 🔑 Yes |

> [!NOTE]  
> **Authentication:** Tools that require authentication (`Auth Required: Yes`) expect your Estagionauta Access Token (JWT). You can easily copy this token in your browser by logging into [estagionauta.com.br](https://estagionauta.com.br), heading to **Configurações da Conta** (Account Settings), and clicking "Copiar Token".

## 🚀 Quick Start

### Method A: Remote Server-Sent Events (SSE) — Recommended (No Node.js required)

Configure your client to connect to the hosted URL:
`https://estagionauta-mcp.paulmspessoa.workers.dev/mcp`

#### Claude Desktop (SSE)
Add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "estagionauta-mcp": {
      "url": "https://estagionauta-mcp.paulmspessoa.workers.dev/mcp"
    }
  }
}
```

#### Claude Code (SSE)
Run this in your terminal:
```bash
claude mcp add estagionauta-mcp sse https://estagionauta-mcp.paulmspessoa.workers.dev/mcp
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

The MCP server **never** accesses the database directly. All data flows through the Estagionauta API, which handles authentication, rate limiting, and data validation.

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/paulpessoa/estagionauta-mcp.git
cd estagionauta-mcp

# Install dependencies
npm install

# Build
npm run build

# Test with MCP Inspector
npm run inspector
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
