import type { LlmProviderInterface, LlmConfig, LlmMessage, LlmResponse } from "../types.js";

export class OpenAiProvider implements LlmProviderInterface {
  name = "openai";

  async chat(messages: LlmMessage[], config: LlmConfig): Promise<LlmResponse> {
    const res = await fetch(config.api_url || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
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
      throw new Error(`OpenAI API error: ${res.status} ${text}`);
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
