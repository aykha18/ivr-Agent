import { Router, type Request, type Response } from 'express';
import { withDbWrite } from '../../db/database.js';
import { createNewSession, setLanguage, processTurn } from '../../services/orchestrator.js';
import { getAdapter } from '../../services/telephony/factory.js';
import { validateSharedSecret } from '../../middleware/webhook.js';

const router = Router();
const asteriskSecret = process.env.ASTERISK_WEBHOOK_SECRET;

router.post(
  '/ari/channels/create',
  validateSharedSecret(asteriskSecret),
  (req: Request, res: Response) => {
    const channelId = req.body.channel_id as string | undefined;
    const callerNumber = req.body.caller_number as string | undefined;
    
    if (!channelId) {
      res.status(400).json({ error: 'channel_id required' });
      return;
    }

    withDbWrite(async (db) => {
      const result = await createNewSession(db, 'asterisk');
      const adapter = getAdapter('asterisk');

      adapter.onInput((input) => {
        processTurn(db, result.session_id, input.text || '');
      });

      res.status(200).json({
        session_id: result.session_id,
        channel_id: channelId,
        caller: callerNumber,
        next_prompt: result.next_prompt,
      });
    });
  },
);

router.post(
  '/ari/events',
  validateSharedSecret(asteriskSecret),
  (req: Request, res: Response) => {
    const eventType = req.body.type as string;
    const channel = req.body.channel?.id as string | undefined;
    const text = req.body.text as string | undefined;
    const dtmf = req.body.dtmf as string | undefined;

    if (eventType === 'channelDtmfReceived' && dtmf && channel) {
      const lang = dtmf === '1' ? 'en' : dtmf === '2' ? 'ar' : dtmf === '3' ? 'ur' : 'en';
      withDbWrite(async (db) => {
        await setLanguage(db, channel, lang);
      });
    }

    if (channel && (eventType === 'channelDtmfReceived' || eventType === 'channelTalk')) {
      const adapter = getAdapter('asterisk');
      adapter.receiveInput(channel, {
        type: eventType === 'channelDtmfReceived' ? 'dtmf' : 'text',
        text: text || dtmf || '',
        dtmf: dtmf,
      });
    }

    res.status(200).json({ ok: true });
  },
);

router.post(
  '/ari/answer',
  validateSharedSecret(asteriskSecret),
  (req: Request, res: Response) => {
    const channelId = req.body.channel_id as string | undefined;
    if (channelId) {
      const adapter = getAdapter('asterisk');
      adapter.updateChannelState(channelId, 'up');
    }
    res.status(200).json({ ok: true });
  },
);

router.post(
  '/ari/hangup',
  validateSharedSecret(asteriskSecret),
  (req: Request, res: Response) => {
    const channelId = req.body.channel_id as string | undefined;
    if (channelId) {
      const adapter = getAdapter('asterisk');
      adapter.endSession({ sessionId: channelId, channel: 'asterisk', metadata: {} });
    }
    res.status(200).json({ ok: true });
  },
);

export default router;
