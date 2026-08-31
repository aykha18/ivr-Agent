import type { LlmProviderInterface, LlmConfig, LlmMessage, LlmResponse } from "../types.js";

export class MockProvider implements LlmProviderInterface {
  name = "mock";

  async chat(_messages: LlmMessage[], _config: LlmConfig): Promise<LlmResponse> {
    return {
      content: "mock response",
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }
}
