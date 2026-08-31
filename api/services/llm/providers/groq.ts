import type { LlmProviderInterface, LlmConfig, LlmMessage, LlmResponse } from "../types.js";

export class GroqProvider implements LlmProviderInterface {
  name = "groq";

  async chat(messages: LlmMessage[], config: LlmConfig): Promise<LlmResponse> {
    const apiKey = config.api_key || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Groq API key is required");
    }

    const baseUrl = (config.api_url || "https://api.groq.com/openai/v1").replace(/\/$/, "");

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const usage = data.usage;

    return {
      content: choice?.message?.content || "",
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
    };
  }
}
