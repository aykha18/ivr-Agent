export type LlmProvider = "openai" | "anthropic" | "ollama" | "mock" | "gemini" | "groq";

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  api_url?: string;
  api_key?: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LlmProviderInterface {
  name: string;
  chat(messages: LlmMessage[], config: LlmConfig): Promise<LlmResponse>;
}
