import type { LlmProviderInterface, LlmConfig, LlmMessage, LlmResponse } from "../types.js";

export class AnthropicProvider implements LlmProviderInterface {
  name = "anthropic";

  async chat(messages: LlmMessage[], config: LlmConfig): Promise<LlmResponse> {
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const res = await fetch(config.api_url || "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.api_key || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        system: systemMessage?.content,
        messages: nonSystemMessages,
        temperature: config.temperature,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || "";
    const usage = data.usage;

    return {
      content,
      usage: usage
        ? {
            promptTokens: usage.input_tokens,
            completionTokens: usage.output_tokens,
            totalTokens: usage.input_tokens + usage.output_tokens,
          }
        : undefined,
    };
  }
}
