import { Router, type Request, type Response } from 'express';
import { withDbWrite } from '../../db/database.js';
import { createNewSession, setLanguage, processTurn } from '../../services/orchestrator.js';
import { getAdapter } from '../../services/telephony/factory.js';
import { validateSharedSecret } from '../../middleware/webhook.js';

const router = Router();
const yeastarSecret = process.env.YEASTAR_WEBHOOK_SECRET;

router.post(
  '/call',
  validateSharedSecret(yeastarSecret),
  (req: Request, res: Response) => {
    const callId = req.body.call_id as string | undefined;
    const callerNumber = req.body.caller_number as string | undefined;

    if (!callId) {
      res.status(400).json({ error: 'call_id required' });
      return;
    }

    withDbWrite(async (db) => {
      const result = await createNewSession(db, 'yeastar');
      const adapter = getAdapter('yeastar');

      adapter.onInput((input) => {
        processTurn(db, result.session_id, input.text || '');
      });

      res.status(200).json({
        session_id: result.session_id,
        call_id: callId,
        caller: callerNumber,
        next_prompt: result.next_prompt,
      });
    });
  },
);

router.post(
  '/events',
  validateSharedSecret(yeastarSecret),
  (req: Request, res: Response) => {
    const eventType = req.body.event as string;
    const callId = req.body.call_id as string | undefined;
    const text = req.body.text as string | undefined;
    const dtmf = req.body.dtmf as string | undefined;

    if (eventType === 'dtmf' && dtmf && callId) {
      const lang = dtmf === '1' ? 'en' : dtmf === '2' ? 'ar' : dtmf === '3' ? 'ur' : 'en';
      withDbWrite(async (db) => {
        await setLanguage(db, callId, lang);
      });
    }

    if (callId && (eventType === 'dtmf' || eventType === 'speech')) {
      const adapter = getAdapter('yeastar');
      adapter.receiveInput(callId, {
        type: eventType === 'dtmf' ? 'dtmf' : 'text',
        text: text || dtmf || '',
        dtmf: dtmf,
      });
    }

    res.status(200).json({ ok: true });
  },
);

router.post(
  '/answer',
  validateSharedSecret(yeastarSecret),
  (req: Request, res: Response) => {
    const callId = req.body.call_id as string | undefined;
    if (callId) {
      const adapter = getAdapter('yeastar');
      adapter.updateCallState(callId, 'up');
    }
    res.status(200).json({ ok: true });
  },
);

router.post(
  '/hangup',
  validateSharedSecret(yeastarSecret),
  (req: Request, res: Response) => {
    const callId = req.body.call_id as string | undefined;
    if (callId) {
      const adapter = getAdapter('yeastar');
      adapter.endSession({ sessionId: callId, channel: 'yeastar', metadata: {} });
    }
    res.status(200).json({ ok: true });
  },
);

export default router;
