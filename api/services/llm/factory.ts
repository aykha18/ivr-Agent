import type { LlmConfig, LlmProviderInterface } from "./types.js";
import { OpenAiProvider } from "./providers/openai.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { OllamaProvider } from "./providers/ollama.js";
import { MockProvider } from "./providers/mock.js";
import { GeminiProvider } from "./providers/gemini.js";
import { GroqProvider } from "./providers/groq.js";

const PROVIDERS: Record<string, LlmProviderInterface> = {
  openai: new OpenAiProvider(),
  anthropic: new AnthropicProvider(),
  ollama: new OllamaProvider(),
  mock: new MockProvider(),
  gemini: new GeminiProvider(),
  groq: new GroqProvider(),
};

export function getLlmProvider(provider: string): LlmProviderInterface {
  const p = PROVIDERS[provider.toLowerCase()];
  if (!p) {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }
  return p;
}

export function getLlmConfig(): LlmConfig {
  return {
    provider: (process.env.LLM_PROVIDER as LlmConfig["provider"]) || "mock",
    model: process.env.LLM_MODEL || "mock-model",
    api_url: process.env.LLM_API_URL || undefined,
    api_key: process.env.LLM_API_KEY || undefined,
    temperature: Number(process.env.LLM_TEMPERATURE ?? 0.7),
    maxTokens: Number(process.env.LLM_MAX_TOKENS ?? 256),
    enabled: process.env.LLM_ENABLED !== "false",
  };
}
