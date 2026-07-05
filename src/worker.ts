import { createServer } from "./server.js";
import { createMcpHandler } from "agents/mcp";

/**
 * Cloudflare Worker entry point.
 * Intercepts normal browser requests (HTML) to serve a setup instructions page,
 * and routes JSON-RPC/SSE traffic to the Cloudflare Agents MCP handler.
 */
export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    const acceptHeader = request.headers.get("Accept") || "";

    // Check if it is a standard web browser request instead of an MCP connection
    if (
      request.method === "GET" &&
      !acceptHeader.includes("text/event-stream")
    ) {
      return new Response(
        `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estagionauta MCP Server</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #0b0f19 0%, #111827 100%);
            color: #f3f4f6;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .container {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 3rem 2rem;
            border-radius: 24px;
            max-width: 480px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        h1 {
            font-size: 2.2rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        p {
            color: #9ca3af;
            font-size: 1.05rem;
            line-height: 1.6;
            margin: 0.5rem 0 1.5rem 0;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(16, 185, 129, 0.1);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 0.4rem 1rem;
            border-radius: 50px;
            font-weight: 600;
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
        }
        .badge-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 8px #10b981;
        }
        .code-title {
            text-align: left;
            font-size: 0.8rem;
            color: #6b7280;
            margin-bottom: 0.4rem;
            padding-left: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
        }
        .code-box {
            background: #030712;
            padding: 1.2rem;
            border-radius: 14px;
            font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 0.85rem;
            border: 1px solid #1f2937;
            margin-bottom: 2rem;
            word-break: break-all;
            color: #38bdf8;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
        }
        .footer {
            font-size: 0.8rem;
            color: #4b5563;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 1.5rem;
            margin-top: 1.5rem;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="badge"><span class="badge-dot"></span> Online & Saudável</div>
        <h1>Estagionauta MCP</h1>
        <p>O seu Servidor de Ferramentas de IA (Model Context Protocol) está ativo na Cloudflare.</p>
        
        <div class="code-title">URL de Conexão (SSE)</div>
        <div class="code-box">https://estagionauta-mcp.paulmspessoa.workers.dev/mcp</div>
        
        <p style="font-size: 0.9rem; color: #6b7280; margin-bottom: 0;">Configure esta URL no seu Claude Desktop, Cursor ou Cherry Studio para dar superpoderes ao seu chat.</p>
        
        <div class="footer">Estagionauta © 2026 — Decolando a sua carreira</div>
    </div>
</body>
</html>`,
        {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    // Create a fresh MCP server instance per request.
    // The MCP SDK does NOT allow connecting an already-connected server to a new transport.
    // Reusing a singleton server causes "Worker threw exception" (Cloudflare Error 1101).
    const server = createServer();
    const mcpHandler = createMcpHandler(server);
    return mcpHandler(request, env, ctx);
  },
};

