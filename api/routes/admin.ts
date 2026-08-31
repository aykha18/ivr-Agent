import { Router, type Request, type Response } from 'express';
import { Socket } from 'net';
import { withDb, withDbWrite } from '../db/database.js';
import { getAdminMetrics, getAdminRecords, getLlmConfig, upsertLlmConfig, getTelephonyConfig, upsertTelephonyConfig, addAuditLog, getAuditLogs } from '../repositories/store.js';
import type { LlmConfig, TelephonyConfig } from '../../shared/types.js';
import { reloadAdaptersFromDb } from '../services/telephony/factory.js';

const router = Router();

router.get('/metrics', (req: Request, res: Response) => {
  withDb(async (db) => {
    const metrics = getAdminMetrics(db);
    res.status(200).json(metrics);
  });
});

router.get('/records', (req: Request, res: Response) => {
  withDb(async (db) => {
    const records = getAdminRecords(db);
    res.status(200).json(records);
  });
});

router.get('/llm', (req: Request, res: Response) => {
  withDb(async (db) => {
    const config = getLlmConfig(db);
    res.status(200).json(config);
  });
});

router.post('/llm', (req: Request<unknown, unknown, LlmConfig>, res: Response) => {
  withDbWrite(async (db) => {
    const oldConfig = getLlmConfig(db);
    upsertLlmConfig(db, req.body);
    const updated = getLlmConfig(db);
    addAuditLog(db, {
      action: 'update',
      resource_type: 'llm_config',
      resource_id: 'active',
      old_value: JSON.stringify(oldConfig),
      new_value: JSON.stringify(updated),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || undefined,
    });
    res.status(200).json(updated);
  });
});

router.get('/telephony', (req: Request, res: Response) => {
  withDb(async (db) => {
    const config = getTelephonyConfig(db);
    res.status(200).json(config);
  });
});

router.post('/telephony', (req: Request<unknown, unknown, TelephonyConfig>, res: Response) => {
  withDbWrite(async (db) => {
    const oldConfig = getTelephonyConfig(db);
    upsertTelephonyConfig(db, req.body);
    reloadAdaptersFromDb().catch(() => {});
    const updated = getTelephonyConfig(db);
    addAuditLog(db, {
      action: 'update',
      resource_type: 'telephony_config',
      resource_id: 'active',
      old_value: JSON.stringify(oldConfig),
      new_value: JSON.stringify(updated),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || undefined,
    });
    res.status(200).json(updated);
  });
});

router.post('/telephony/validate', (req: Request<unknown, Response, TelephonyConfig>, res: Response) => {
  withDb(async (db) => {
    const config = getTelephonyConfig(db);
    const provider = req.body.provider || config.provider;

    if (provider === 'asterisk') {
      const baseUrl = (req.body.api_url || config.api_url || 'http://localhost:8088/ari').replace(/\/$/, '');
      const appName = req.body.ari_app || config.ari_app || 'ivr-ai';
      const user = req.body.ari_user || config.ari_user || '';
      const pass = req.body.ari_password || config.ari_password || '';

      try {
        const url = new URL(`/applications/${encodeURIComponent(appName)}`, baseUrl);
        const auth = Buffer.from(`${user}:${pass}`).toString('base64');
        const response = await fetch(url.toString(), {
          headers: { Authorization: `Basic ${auth}` },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          res.status(200).json({ valid: true, provider: 'asterisk', message: `ARI app "${appName}" reachable and authenticated` });
        } else if (response.status === 401) {
          res.status(200).json({ valid: false, provider: 'asterisk', message: 'ARI authentication failed' });
        } else if (response.status === 404) {
          res.status(200).json({ valid: false, provider: 'asterisk', message: `ARI app "${appName}" not found` });
        } else {
          res.status(200).json({ valid: false, provider: 'asterisk', message: `ARI returned status ${response.status}` });
        }
      } catch (err) {
        res.status(200).json({ valid: false, provider: 'asterisk', message: err instanceof Error ? err.message : 'Connection failed' });
      }
      return;
    }

    if (provider === 'yeastar') {
      const apiUrl = (req.body.api_url || config.api_url || '').replace(/\/$/, '');
      const apiKey = req.body.api_key || config.api_key || '';
      const sipHost = req.body.sip_trunk_host || config.sip_trunk_host || '';
      const sipPort = req.body.sip_trunk_port || config.sip_trunk_port || 5060;

      const results: string[] = [];

      if (apiUrl) {
        try {
          const response = await fetch(apiUrl, {
            headers: apiKey ? { 'X-API-Key': apiKey } : {},
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok || response.status === 401 || response.status === 403) {
            results.push('Yeastar API reachable');
          } else {
            results.push(`Yeastar API returned status ${response.status}`);
          }
        } catch (err) {
          results.push(`Yeastar API connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (sipHost) {
        const sipResult = await testSipConnectivity(sipHost, sipPort);
        results.push(sipResult);
      }

      if (results.length === 0) {
        res.status(200).json({ valid: false, provider: 'yeastar', message: 'Provide API URL or SIP trunk host to validate' });
        return;
      }

      const hasFailure = results.some(r => r.toLowerCase().includes('failed') || r.toLowerCase().includes('error'));
      res.status(200).json({ valid: !hasFailure, provider: 'yeastar', message: results.join('; ') });
      return;
    }

    if (provider === 'twilio') {
      const accountSid = req.body.api_key || config.api_key || '';
      const authToken = req.body.webhook_secret || config.webhook_secret || '';

      if (!accountSid || !authToken) {
        res.status(200).json({ valid: false, provider: 'twilio', message: 'Account SID and Auth Token are required' });
        return;
      }

      try {
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
          headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}` },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          res.status(200).json({ valid: true, provider: 'twilio', message: 'Twilio credentials valid' });
        } else if (response.status === 401) {
          res.status(200).json({ valid: false, provider: 'twilio', message: 'Twilio authentication failed' });
        } else {
          res.status(200).json({ valid: false, provider: 'twilio', message: `Twilio returned status ${response.status}` });
        }
      } catch (err) {
        res.status(200).json({ valid: false, provider: 'twilio', message: err instanceof Error ? err.message : 'Connection failed' });
      }
      return;
    }

    res.status(200).json({ valid: true, provider, message: 'Simulator does not require validation' });
  });
});

async function testSipConnectivity(host: string, port: number): Promise<string> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const timeout = 5000;
    
    socket.setTimeout(timeout);
    
    socket.connect(port, host, () => {
      socket.end();
      resolve(`SIP trunk ${host}:${port} TCP reachable`);
    });
    
    socket.on('error', (err: NodeJS.ErrnoException) => {
      resolve(`SIP trunk ${host}:${port} unreachable: ${err.message}`);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(`SIP trunk ${host}:${port} connection timed out`);
    });
  });
}

router.get('/audit', (req: Request, res: Response) => {
  withDb(async (db) => {
    const limit = Number(req.query.limit ?? 100);
    const logs = getAuditLogs(db, Math.min(limit, 500));
    res.status(200).json({ logs });
  });
});

router.get('/telephony/status', (req: Request, res: Response) => {
  withDb(async (db) => {
    const config = getTelephonyConfig(db);
    const provider = config.provider;

    if (provider === 'asterisk') {
      const baseUrl = (config.api_url || 'http://localhost:8088/ari').replace(/\/$/, '');
      const appName = config.ari_app || 'ivr-ai';
      const user = config.ari_user || '';
      const pass = config.ari_password || '';
      const auth = Buffer.from(`${user}:${pass}`).toString('base64');

      try {
        const appUrl = new URL(`/applications/${encodeURIComponent(appName)}`, baseUrl);
        const appResponse = await fetch(appUrl.toString(), {
          headers: { Authorization: `Basic ${auth}` },
          signal: AbortSignal.timeout(5000),
        });

        const channelsUrl = new URL(`/applications/${encodeURIComponent(appName)}/channels`, baseUrl);
        const channelsResponse = await fetch(channelsUrl.toString(), {
          headers: { Authorization: `Basic ${auth}` },
          signal: AbortSignal.timeout(5000),
        });

        let channels: any[] = [];
        if (channelsResponse.ok) {
          channels = await channelsResponse.json();
        }

        if (appResponse.ok) {
          const appInfo = await appResponse.json();
          res.status(200).json({
            provider: 'asterisk',
            connected: true,
            ari_app: appName,
            ari_app_status: appInfo.status || 'running',
            active_channels: channels.length,
            channels: channels.map((ch: any) => ({
              id: ch.id,
              name: ch.name,
              state: ch.state,
              caller: ch.caller?.number,
            })),
          });
        } else if (appResponse.status === 401) {
          res.status(200).json({
            provider: 'asterisk',
            connected: false,
            ari_app: appName,
            error: 'ARI authentication failed',
          });
        } else {
          res.status(200).json({
            provider: 'asterisk',
            connected: false,
            ari_app: appName,
            error: `ARI returned status ${appResponse.status}`,
          });
        }
      } catch (err) {
        res.status(200).json({
          provider: 'asterisk',
          connected: false,
          ari_app: appName,
          error: err instanceof Error ? err.message : 'Connection failed',
        });
      }
      return;
    }

    if (provider === 'yeastar') {
      const apiUrl = (config.api_url || '').replace(/\/$/, '');
      const sipHost = config.sip_trunk_host || '';
      const sipPort = config.sip_trunk_port || 5060;
      const results: string[] = [];
      let apiReachable = false;
      let sipReachable = false;

      if (apiUrl) {
        try {
          const response = await fetch(apiUrl, {
            headers: config.api_key ? { 'X-API-Key': config.api_key } : {},
            signal: AbortSignal.timeout(5000),
          });
          apiReachable = response.ok || response.status === 401 || response.status === 403;
          results.push(apiReachable ? 'API reachable' : `API status ${response.status}`);
        } catch {
          results.push('API unreachable');
        }
      }

      if (sipHost) {
        const sipResult = await testSipConnectivity(sipHost, sipPort);
        sipReachable = sipResult.includes('reachable');
        results.push(sipResult);
      }

      res.status(200).json({
        provider: 'yeastar',
        connected: apiReachable || sipReachable,
        api_reachable: apiReachable,
        sip_trunk_reachable: sipReachable,
        details: results,
      });
      return;
    }

    if (provider === 'twilio') {
      const accountSid = config.api_key || '';
      const authToken = config.webhook_secret || '';
      let twilioConnected = false;

      if (accountSid && authToken) {
        try {
          const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
            headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}` },
          });
          twilioConnected = response.ok;
        } catch {
          twilioConnected = false;
        }
      }

      res.status(200).json({
        provider: 'twilio',
        connected: twilioConnected,
        account_sid: accountSid ? `${accountSid.slice(0, 6)}...` : undefined,
      });
      return;
    }

    res.status(200).json({
      provider: 'simulator',
      connected: true,
      message: 'Simulator is running',
    });
  });
});
router.get('/metrics/prometheus', (req: Request, res: Response) => {
  withDb(async (db) => {
    const metrics = getAdminMetrics(db);
    const lines: string[] = [];
    lines.push('# HELP ivr_sessions_total Total number of sessions');
    lines.push('# TYPE ivr_sessions_total gauge');
    lines.push(`ivr_sessions_total ${metrics.total_sessions}`);
    lines.push('# HELP ivr_containment_total Number of self-service completed sessions');
    lines.push('# TYPE ivr_containment_total gauge');
    lines.push(`ivr_containment_total ${metrics.containment_count}`);
    lines.push('# HELP ivr_escalation_total Number of sessions requiring agent');
    lines.push('# TYPE ivr_escalation_total gauge');
    lines.push(`ivr_escalation_total ${metrics.escalation_count}`);
    lines.push('# HELP ivr_callbacks_total Number of callback requests');
    lines.push('# TYPE ivr_callbacks_total gauge');
    lines.push(`ivr_callbacks_total ${metrics.callback_count}`);
    lines.push('# HELP ivr_tickets_total Number of tickets created');
    lines.push('# TYPE ivr_tickets_total gauge');
    lines.push(`ivr_tickets_created ${metrics.tickets_created}`);
    lines.push('# HELP ivr_whatsapp_total Number of WhatsApp messages sent');
    lines.push('# TYPE ivr_whatsapp_total gauge');
    lines.push(`ivr_whatsapp_sent ${metrics.whatsapp_sent}`);
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(lines.join('\n') + '\n');
  });
});

export default router;
