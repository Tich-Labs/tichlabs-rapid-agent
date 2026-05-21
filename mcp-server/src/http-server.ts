import http from "http";
import { matchServicesSmart } from "./tools/match-services.js";
import { assessRiskSmart } from "./tools/assess-risk.js";
import { generateFHIRBundle } from "./tools/generate-fhir.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const API_KEY = process.env.MCP_API_KEY ?? "";

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405);
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const providedKey = req.headers["x-api-key"];
  if (providedKey !== API_KEY) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: "Unauthorized — invalid or missing API key" }));
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  let body = "";
  for await (const chunk of req) body += chunk;

  try {
    const input = JSON.parse(body);
    let result: unknown;

    switch (path) {
      case "/tools/match_services": {
        result = await matchServicesSmart(input);
        break;
      }
      case "/tools/assess_risk": {
        result = await assessRiskSmart(input);
        break;
      }
      case "/tools/generate_fhir_bundle": {
        result = await generateFHIRBundle(input);
        break;
      }
      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: `Unknown tool: ${path}` }));
        return;
    }

    res.writeHead(200);
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(400);
    res.end(JSON.stringify({
      error: err instanceof Error ? err.message : "Invalid request",
    }));
  }
});

server.listen(PORT, () => {
  console.error(`Tich Labs MCP HTTP server running on http://localhost:${PORT}`);
  console.error("Available endpoints:");
  console.error("  POST /tools/match_services");
  console.error("  POST /tools/assess_risk");
  console.error("  POST /tools/generate_fhir_bundle");
});
