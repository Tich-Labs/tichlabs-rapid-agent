import OpenAI from "openai";

export interface LLMConfig {
  provider: string;
  model: string;
}

let client: OpenAI | null = null;
let config: LLMConfig | null = null;

function detectConfig(): { apiKey: string; baseURL: string; model: string; provider: string } | null {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    return {
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      provider: "gemini",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && openaiKey !== "sk-your-key-here") {
    return {
      apiKey: openaiKey,
      baseURL: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      provider: "openai",
    };
  }

  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey && groqKey !== "your-groq-key-here") {
    return {
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      provider: "groq",
    };
  }

  const ollamaUrl = process.env.OLLAMA_BASE_URL;

  if (ollamaUrl) {
    return {
      apiKey: "ollama",
      baseURL: ollamaUrl.replace(/\/$/, "") + "/v1",
      model: process.env.OLLAMA_MODEL || "llama3.2",
      provider: "ollama",
    };
  }

  return null;
}

function initClient(): void {
  const cfg = detectConfig();
  if (!cfg) {
    client = null;
    config = null;
    return;
  }
  client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });
  config = { provider: cfg.provider, model: cfg.model };
}

export function getLLM(): OpenAI | null {
  if (client === null && config === null) {
    initClient();
  }
  return client;
}

export function getLLMConfig(): LLMConfig | null {
  if (client === null && config === null) {
    initClient();
  }
  return config;
}

export function hasLLM(): boolean {
  if (client === null && config === null) {
    initClient();
  }
  return client !== null;
}
