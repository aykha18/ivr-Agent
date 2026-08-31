import { describe, it, expect } from 'vitest';
import { getLlmProvider } from '../api/services/llm/factory';
import type { LlmConfig } from '../api/services/llm/types';

describe('LLM Factory', () => {
  it('returns OpenAI provider', () => {
    const provider = getLlmProvider('openai');
    expect(provider.name).toBe('openai');
  });

  it('returns Anthropic provider', () => {
    const provider = getLlmProvider('anthropic');
    expect(provider.name).toBe('anthropic');
  });

  it('returns Ollama provider', () => {
    const provider = getLlmProvider('ollama');
    expect(provider.name).toBe('ollama');
  });

  it('returns Mock provider', () => {
    const provider = getLlmProvider('mock');
    expect(provider.name).toBe('mock');
  });

  it('throws for unsupported provider', () => {
    expect(() => getLlmProvider('unknown')).toThrow('Unsupported LLM provider');
  });

  it('Mock provider returns mock response', async () => {
    const provider = getLlmProvider('mock');
    const config: LlmConfig = {
      provider: 'mock',
      model: 'mock-model',
      temperature: 0.7,
      maxTokens: 256,
      enabled: true,
    };
    const response = await provider.chat([{ role: 'user', content: 'test' }], config);
    expect(response.content).toBe('mock response');
  });
});
