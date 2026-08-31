import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { withDb } from '../api/db/database';
import { addAuditLog, getAuditLogs, getSession, getTurnsForSession } from '../api/repositories/store';
import { createNewSession } from '../api/services/orchestrator';
import type { Database } from 'sql.js';

describe('Metrics and Session Recovery', () => {
  it('returns metrics from store', async () => {
    await withDb(async (db) => {
      const { getAdminMetrics } = await import('../api/repositories/store');
      const metrics = getAdminMetrics(db);
      expect(metrics.total_sessions).toBeGreaterThanOrEqual(0);
      expect(metrics.language_split).toBeDefined();
    });
  });

  it('returns empty audit logs by default', async () => {
    await withDb(async (db) => {
      db.run("DELETE FROM audit_log");
      const logs = getAuditLogs(db, 10);
      expect(logs).toHaveLength(0);
    });
  });

  it('creates session and can recover it', async () => {
    await withDb(async (db) => {
      const result = await createNewSession(db, 'simulator');
      const session = getSession(db, result.session_id);
      expect(session).not.toBeNull();
      expect(session?.session_id).toBe(result.session_id);
      const turns = getTurnsForSession(db, result.session_id);
      expect(turns).toHaveLength(0);
    });
  });
});
