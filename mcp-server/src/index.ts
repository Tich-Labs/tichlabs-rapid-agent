#!/usr/bin/env node

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { MatchServicesInput, matchServicesSmart } from "./tools/match-services.js";
import { GenerateFHIRBundleInput, generateFHIRBundle } from "./tools/generate-fhir.js";
import { AssessRiskInput, assessRiskSmart } from "./tools/assess-risk.js";
import { StoreCaseDocumentInput, SearchCaseDocumentsInput, AggregateCasesInput, storeCaseDocument, searchCaseDocuments, aggregateCases } from "./tools/mongodb-tools.js";

/** Create and configure a fresh Server instance. Called once for stdio, once per HTTP request. */
function createMCPServer(): Server {
  const srv = new Server(
    { name: "tichlabs-incident-tracker", version: "1.0.0" },
    {
      capabilities: {
        tools: {},
        extensions: {
          "ai.promptopinion/fhir-context": {
            scopes: [
              { name: "patient/Observation.rs" },
              { name: "patient/Observation.write" },
              { name: "patient/Patient.rs" },
              { name: "patient/ServiceRequest.rs" },
              { name: "patient/ServiceRequest.write" },
              { name: "patient/Consent.write" },
              { name: "patient/Location.rs" },
            ],
          },
        },
      },
    }
  );

  srv.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "match_services",
        description: "Match an SGBV incident to appropriate referral services based on incident type, location, and context. Uses AI when available, falls back to keyword matching. Returns scored service recommendations with reasoning.",
        inputSchema: zodToJsonSchema(MatchServicesInput),
      },
      {
        name: "generate_fhir_bundle",
        description: "Generate a FHIR R4 transaction Bundle from an SGBV incident. Creates Observation (incident details), Patient (anonymized survivor), Consent (privacy consent), Location (service providers), and ServiceRequest (referrals) resources. Optionally accepts fhirServerUrl and fhirToken (from SHARP context) to submit directly to a FHIR-compliant EHR.",
        inputSchema: zodToJsonSchema(GenerateFHIRBundleInput),
      },
      {
        name: "assess_risk",
        description: "Assess risk and severity of an SGBV incident. Returns a risk score (0-100), severity level, urgency, contributing factors, and recommended actions. Uses AI when available.",
        inputSchema: zodToJsonSchema(AssessRiskInput),
      },
      {
        name: "store_case_document",
        description: "Store a case narrative/document in MongoDB for rich search and analytics. Persists incident details including type, description, location, risk score, and tags.",
        inputSchema: zodToJsonSchema(StoreCaseDocumentInput),
      },
      {
        name: "search_case_documents",
        description: "Full-text search across stored case documents in MongoDB. Find similar cases by description, location, or tags. Supports filtering by incident type, location, and status.",
        inputSchema: zodToJsonSchema(SearchCaseDocumentsInput),
      },
      {
        name: "aggregate_cases",
        description: "Aggregate case data from MongoDB for analytics. Group by incident type, location, severity, status, or month. Returns counts, average risk scores, and top sub-categories.",
        inputSchema: zodToJsonSchema(AggregateCasesInput),
      },
    ],
  }));

  srv.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "match_services": {
        const input = MatchServicesInput.parse(args);
        const matches = await matchServicesSmart(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: matches.length,
                  matches,
                  incidentType: input.incidentType,
                  location: input.location,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "generate_fhir_bundle": {
        const input = GenerateFHIRBundleInput.parse(args);
        const result = await generateFHIRBundle(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  summary: result.summary,
                  bundle: result.bundle,
                  submissionResult: result.submissionResult,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "assess_risk": {
        const input = AssessRiskInput.parse(args);
        const assessment = await assessRiskSmart(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(assessment, null, 2),
            },
          ],
        };
      }

      case "store_case_document": {
        const input = StoreCaseDocumentInput.parse(args);
        const result = await storeCaseDocument(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { action: result.action, document: result.document },
                null,
                2
              ),
            },
          ],
        };
      }

      case "search_case_documents": {
        const input = SearchCaseDocumentsInput.parse(args);
        const result = await searchCaseDocuments(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalCount: result.totalCount,
                  results: result.results.map((r) => ({
                    score: r.score,
                    highlights: r.highlights,
                    incidentType: r.document.incidentType,
                    location: r.document.location,
                    description: r.document.description.slice(0, 200),
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "aggregate_cases": {
        const input = AggregateCasesInput.parse(args);
        const result = await aggregateCases(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [{ type: "text", text: `Invalid input: ${error.message}` }],
        isError: true,
      };
    }
    throw error;
  }
  });

  return srv;
}

async function main() {
  const mode = process.env.MCP_TRANSPORT ?? "stdio";

  if (mode === "http") {
    // HTTP mode — for Prompt Opinion and other cloud A2A clients
    const port = parseInt(process.env.PORT ?? "3001", 10);
    const apiKey = process.env.MCP_API_KEY;

    const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      // Health check
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", server: "tichlabs-mcp-server" }));
        return;
      }

      // Debug — always shows key info without auth
      if (req.url === "/debug") {
        const raw: Record<string, string> = {};
        for (const k of Object.keys(process.env)) {
          if (k.includes("SUPABASE") || k.includes("VITE_") || k.includes("API_KEY") || k.includes("OPENAI") || k.includes("MCP_") || k.includes("NODE_")) {
            const v = process.env[k] ?? "undefined";
            raw[k] = v.length > 0 ? `${v.slice(0, 12)}... (len=${v.length})` : `EMPTY STRING (len=0)`;
          }
        }
        let servicesCount = -1;
        let serviceNames: string[] = [];
        let error: string | null = null;
        let llmInfo: string | null = null;
        try {
          const { getActiveServices } = await import("./lib/supabase.js");
          const services = await getActiveServices();
          servicesCount = services.length;
          serviceNames = services.map((s) => s.name);
        } catch (e: unknown) {
          error = String(e);
          if (e instanceof Error && e.stack) error += "\n" + e.stack;
        }
        try {
          const { getLLMConfig } = await import("./lib/llm.js");
          const cfg = getLLMConfig();
          llmInfo = cfg ? `${cfg.provider} (${cfg.model})` : "none (keyword matching)";
        } catch { /* ignore */ }
        let mongoStatus = "not configured";
        try {
          const { isMongoAvailable } = await import("./lib/mongodb.js");
          mongoStatus = (await isMongoAvailable()) ? "connected" : "disconnected";
        } catch { /* ignore */ }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          nodeVersion: process.version,
          raw,
          llm: llmInfo,
          mongodb: mongoStatus,
          servicesCount,
          serviceNames,
          error,
        }, null, 2));
        return;
      }

      // API key validation
      if (apiKey) {
        const incoming = req.headers["x-api-key"];
        if (incoming !== apiKey) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized" }));
          return;
        }
      }

      if (req.url === "/mcp" || req.url === "/") {
        // MCP Streamable HTTP requires Accept to include both json and event-stream
        const accept = req.headers.accept || "";
        if (!accept.includes("text/event-stream") || !accept.includes("application/json")) {
          req.headers.accept = "application/json, text/event-stream";
        }

        const mcpServer = createMCPServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res);
        return;
      }

      res.writeHead(404);
      res.end();
    });

    httpServer.listen(port, () => {
      console.error(`Tich Labs MCP Server (HTTP) listening on port ${port}`);
    });
  } else {
    // Stdio mode — for Claude Desktop and local MCP clients
    const transport = new StdioServerTransport();
    await createMCPServer().connect(transport);
    console.error("Tich Labs MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
