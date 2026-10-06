import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";

const API = "https://estagionauta-api-991344207740.southamerica-east1.run.app";

async function connect(authToken?: string) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([createServer(authToken).connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

function textOf(result: Awaited<ReturnType<Client["callTool"]>>) {
  return (result.content as { type: string; text: string }[])[0].text;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("estagionauta-mcp tools", () => {
  it("registers all 7 tools", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "calculate_recess",
      "candidatura_stats",
      "check_candidatures",
      "check_credits",
      "get_agency_details",
      "redeem_coupon",
      "search_agencies",
    ]);
  });

  it("calculate_recess: 12 months gives 30 days without calling the API", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "calculate_recess",
      arguments: { startDate: "2025-01-01", endDate: "2026-01-01", salary: 1200 },
    });
    const data = JSON.parse(textOf(result));
    expect(data.monthsWorked).toBe(12);
    expect(data.recessDays).toBe(30);
    expect(data.recessPayment).toBe(1200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calculate_recess: rejects an invalid start date", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "calculate_recess",
      arguments: { startDate: "not-a-date", salary: 1000 },
    });
    expect(textOf(result)).toMatch(/Invalid start date/);
  });

  it("search_agencies: forwards filters as query params", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, agencies: [] }));
    const client = await connect();
    await client.callTool({ name: "search_agencies", arguments: { state: "PE", city: "Recife" } });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(`${API}/api/agencies`);
    expect(url.searchParams.get("state")).toBe("PE");
    expect(url.searchParams.get("city")).toBe("Recife");
  });

  it("check_credits: sends the token as Bearer auth", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ credits: 10, total_credits_used: 2, total_credits_purchased: 0, subscription_status: "free" })
    );
    const client = await connect();
    const result = await client.callTool({ name: "check_credits", arguments: { token: "jwt-123" } });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer jwt-123");
    expect(JSON.parse(textOf(result)).balance.availableCredits).toBe(10);
  });

  it("redeem_coupon: returns isError when the API fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Cupom inválido" }, 400));
    const client = await connect();
    const result = await client.callTool({
      name: "redeem_coupon",
      arguments: { token: "jwt-123", code: "NOPE" },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/400/);
  });

  it("uses the connection token when the tool call omits it", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const client = await connect("header-jwt");
    await client.callTool({ name: "check_candidatures", arguments: {} });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer header-jwt");
  });

  it("returns an error without any token", async () => {
    const client = await connect();
    const result = await client.callTool({ name: "candidatura_stats", arguments: {} });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/Missing authentication token/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
