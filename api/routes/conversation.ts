import { Router, type Request, type Response } from 'express';
import { withDbWrite } from '../db/database.js';
import { processTurn, sendWhatsAppForSession, requestCallbackForSession, endSession } from '../services/orchestrator.js';
import { getLlmConfig } from '../repositories/store.js';
import { validate } from '../middleware/validation.js';
import type { TurnRequest, CallbackRequest } from '../../shared/types.js';
import { TurnRequestSchema, CallbackRequestSchema } from '../middleware/validation.js';

const router = Router({ mergeParams: true });

router.post(
  '/:sessionId/turns',
  validate(TurnRequestSchema),
  (req: Request<{ sessionId: string }, unknown, TurnRequest>, res: Response) => {
    withDbWrite(async (db) => {
      try {
        const text = req.body.text || '';
        const llmConfig = getLlmConfig(db);
        const result = await processTurn(db, req.params.sessionId, text, {}, llmConfig);
        res.status(200).json(result);
      } catch {
        res.status(500).json({ error: 'Failed to process turn' });
      }
    });
  },
);

router.post(
  '/:sessionId/callback',
  validate(CallbackRequestSchema),
  (req: Request<{ sessionId: string }, unknown, CallbackRequest>, res: Response) => {
    withDbWrite(async (db) => {
      try {
        const result = await requestCallbackForSession(
          db,
          req.params.sessionId,
          req.body.reason,
        );
        res.status(200).json({
          callback_id: result.callback_id,
          status: result.status,
        });
      } catch {
        res.status(404).json({ error: 'Session not found' });
      }
    });
  },
);

router.post(
  '/:sessionId/whatsapp',
  (req: Request<{ sessionId: string }>, res: Response) => {
    withDbWrite(async (db) => {
      try {
        const result = await sendWhatsAppForSession(db, req.params.sessionId);
        if (result.success) {
          res.status(200).json({ success: true, message_id: result.message });
        } else {
          res.status(400).json({ success: false, error: result.message });
        }
      } catch {
        res.status(404).json({ error: 'Session not found' });
      }
    });
  },
);

router.post(
  '/:sessionId/end',
  (req: Request<{ sessionId: string }>, res: Response) => {
    withDbWrite(async (db) => {
      await endSession(db, req.params.sessionId);
      res.status(200).json({ ok: true });
    });
  },
);

export default router;