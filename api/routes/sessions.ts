import { Router, type Request, type Response } from 'express';
import { withDb } from '../db/database.js';
import { createNewSession, setLanguage } from '../services/orchestrator.js';
import { validate } from '../middleware/validation.js';
import type { CreateSessionRequest, SetLanguageRequest } from '../../shared/types.js';
import { CreateSessionSchema, SetLanguageSchema } from '../middleware/validation.js';
import { getSession, getTurnsForSession } from '../repositories/store.js';

const router = Router();

router.post(
  '/',
  validate(CreateSessionSchema),
  (req: Request<unknown, unknown, CreateSessionRequest>, res: Response) => {
    withDb(async (db) => {
      const result = await createNewSession(db, req.body.channel ?? 'yeastar');
      res.status(200).json(result);
    });
  },
);

router.get('/:sessionId', (req: Request<{ sessionId: string }>, res: Response) => {
  withDb(async (db) => {
    const session = getSession(db, req.params.sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const turns = getTurnsForSession(db, req.params.sessionId);
    res.status(200).json({ session, turns });
  });
});

router.post(
  '/:sessionId/language',
  validate(SetLanguageSchema),
  (req: Request<{ sessionId: string }, unknown, SetLanguageRequest>, res: Response) => {
    withDb(async (db) => {
      const result = await setLanguage(db, req.params.sessionId, req.body.language);
      if ('error' in result) {
        res.status(404).json({ error: result.error });
      } else {
        res.status(200).json(result);
      }
    });
  },
);

export default router;
