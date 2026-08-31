import { describe, it, expect, beforeEach } from 'vitest';
import { withDb } from '../api/db/database';
import { getLlmConfig, upsertLlmConfig, getTelephonyConfig, upsertTelephonyConfig } from '../api/repositories/store';
import type { LlmConfig, TelephonyConfig } from '../shared/types';

describe('Admin Store Integration', () => {
  beforeEach(async () => {
    await withDb(async (db) => {
      db.run("DELETE FROM llm_config WHERE config_key = 'active'");
      db.run("DELETE FROM telephony_config WHERE config_key = 'active'");
    });
  });

  it('saves and retrieves LLM config', async () => {
    await withDb(async (db) => {
      const config: LlmConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        api_url: 'https://api.openai.com/v1',
        api_key: 'sk-test',
        temperature: 0.5,
        maxTokens: 512,
        enabled: true,
      };
      upsertLlmConfig(db, config);
      const retrieved = getLlmConfig(db);
      expect(retrieved.provider).toBe('openai');
      expect(retrieved.model).toBe('gpt-4o-mini');
      expect(retrieved.api_url).toBe('https://api.openai.com/v1');
      expect(retrieved.api_key).toBe('sk-test');
      expect(retrieved.enabled).toBe(true);
    });
  });

  it('saves and retrieves telephony config', async () => {
    await withDb(async (db) => {
      const config: TelephonyConfig = {
        provider: 'yeastar',
        api_url: 'https://yeastar.example.com',
        api_key: 'yeastar-key',
        webhook_secret: 'secret123',
        sip_trunk_host: 'sip.example.com',
        sip_trunk_port: 5060,
        sip_username: 'user',
        sip_password: 'pass',
        outbound_caller_id: '+1234567890',
        enabled: true,
      };
      upsertTelephonyConfig(db, config);
      const retrieved = getTelephonyConfig(db);
      expect(retrieved.provider).toBe('yeastar');
      expect(retrieved.api_url).toBe('https://yeastar.example.com');
      expect(retrieved.webhook_secret).toBe('secret123');
      expect(retrieved.sip_trunk_host).toBe('sip.example.com');
      expect(retrieved.enabled).toBe(true);
    });
  });

  it('returns default telephony config when none exists', async () => {
    await withDb(async (db) => {
      const config = getTelephonyConfig(db);
      expect(config.provider).toBe('yeastar');
      expect(config.enabled).toBe(true);
    });
  });
});
