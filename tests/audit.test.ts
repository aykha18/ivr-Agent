import { describe, it, expect, beforeEach } from 'vitest';
import { withDb } from '../api/db/database';
import { addAuditLog, getAuditLogs } from '../api/repositories/store';

describe('Audit Log', () => {
  beforeEach(async () => {
    await withDb(async (db) => {
      db.run("DELETE FROM audit_log");
    });
  });

  it('adds and retrieves audit logs', async () => {
    await withDb(async (db) => {
      addAuditLog(db, {
        action: 'update',
        resource_type: 'llm_config',
        resource_id: 'active',
        old_value: '{"provider":"mock"}',
        new_value: '{"provider":"openai"}',
        ip_address: '127.0.0.1',
        user_agent: 'test',
      });
      const logs = getAuditLogs(db, 10);
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('update');
      expect(logs[0].resource_type).toBe('llm_config');
      expect(logs[0].new_value).toBe('{"provider":"openai"}');
    });
  });

  it('returns logs in descending order', async () => {
    await withDb(async (db) => {
      addAuditLog(db, { action: 'create', resource_type: 'session', resource_id: '1' });
      addAuditLog(db, { action: 'update', resource_type: 'session', resource_id: '2' });
      const logs = getAuditLogs(db, 10);
      expect(logs[0].resource_id).toBe('2');
      expect(logs[1].resource_id).toBe('1');
    });
  });

  it('respects limit', async () => {
    await withDb(async (db) => {
      for (let i = 0; i < 5; i++) {
        addAuditLog(db, { action: 'test', resource_type: 'x', resource_id: String(i) });
      }
      const logs = getAuditLogs(db, 3);
      expect(logs).toHaveLength(3);
    });
  });
});
