import { describe, it, expect, vi } from 'vitest';
import { classifyIntent, classifyIntentWithLlm } from '../api/services/llm/orchestrator';
import { withDb } from '../api/db/database';
import { getLlmConfig } from '../api/repositories/store';
import { getLlmProvider } from '../api/services/llm/factory';

vi.mock('../api/services/llm/factory', () => ({
  getLlmProvider: vi.fn(),
}));

describe('LLM Orchestrator', () => {
  it('classifies intent with LLM and returns structured result', async () => {
    const mockChat = vi.fn().mockResolvedValue({ content: '{"intent":"order_tracking","confidence":0.95,"slots":{}}' });
    vi.mocked(getLlmProvider).mockReturnValue({ name: 'mock', chat: mockChat } as any);

    await withDb(async (db) => {
      const llmConfig = getLlmConfig(db);
      const result = await classifyIntentWithLlm(db, 'Where is my order?', 'en', llmConfig);
      expect(result.intent).toBe('order_tracking');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  it('classifies unknown intent for greetings', async () => {
    const mockChat = vi.fn().mockResolvedValue({ content: '{"intent":"unknown","confidence":0.9,"slots":{}}' });
    vi.mocked(getLlmProvider).mockReturnValue({ name: 'mock', chat: mockChat } as any);

    await withDb(async (db) => {
      const llmConfig = getLlmConfig(db);
      const result = await classifyIntentWithLlm(db, 'Hello', 'en', llmConfig);
      expect(result.intent).toBe('unknown');
    });
  });

  it('falls back to keyword classifier on LLM error', async () => {
    const mockChat = vi.fn().mockRejectedValue(new Error('LLM unavailable'));
    vi.mocked(getLlmProvider).mockReturnValue({ name: 'mock', chat: mockChat } as any);

    await withDb(async (db) => {
      const badConfig = { ...getLlmConfig(db), enabled: true as const, provider: 'mock' as const, model: 'mock-model' };
      const result = await classifyIntentWithLlm(db, 'Where is my order?', 'en', badConfig);
      expect(result.intent).toBe('unknown');
    });
  });
});
