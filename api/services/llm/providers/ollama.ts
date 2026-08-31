import type { LlmProviderInterface, LlmConfig, LlmMessage, LlmResponse } from "../types.js";

export class OllamaProvider implements LlmProviderInterface {
  name = "ollama";

  async chat(messages: LlmMessage[], config: LlmConfig): Promise<LlmResponse> {
    const baseUrl = (config.api_url || "http://localhost:11434").replace(/\/$/, "");

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const content = data.message?.content || "";

    return {
      content,
      usage: data.prompt_eval_count || data.eval_count
        ? {
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: data.eval_count || 0,
            totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
          }
        : undefined,
    };
  }
}
