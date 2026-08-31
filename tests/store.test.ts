import { describe, it, expect, beforeEach } from 'vitest';
import { getLlmConfig, upsertLlmConfig } from '../api/repositories/store';

describe('LLM Config Store', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it('returns default config when no config exists', () => {
    const config = getLlmConfig(mockDb);
    expect(config.provider).toBe('mock');
    expect(config.model).toBe('mock-model');
    expect(config.enabled).toBe(true);
  });

  it('upserts LLM config', () => {
    const config = {
      provider: 'openai' as const,
      model: 'gpt-4o-mini',
      api_url: 'https://api.openai.com/v1',
      api_key: 'sk-test',
      temperature: 0.5,
      max_tokens: 512,
      enabled: true,
    };
    
    expect(() => upsertLlmConfig(mockDb, config)).not.toThrow();
  });
});

function createMockDb() {
  const rows: Record<string, unknown>[] = [];
  return {
    prepare: () => ({
      bind: () => {},
      step: () => {
        if (rows.length === 0) return false;
        void rows.shift();
        return true;
      },
      getAsObject: () => ({}),
      free: () => {},
    }),
    run: () => {},
    exec: () => {},
    export: () => new Uint8Array(),
  } as unknown as ReturnType<typeof import('sql.js').Database>;
}
