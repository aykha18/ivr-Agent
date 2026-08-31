import { Router, type Request, type Response } from 'express';
import { withDbWrite } from '../db/database.js';
import { getLlmConfig, upsertLlmConfig } from '../repositories/store.js';
import type { LlmConfig } from '../../shared/types.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  withDbWrite(async (db) => {
    const config = getLlmConfig(db);
    res.status(200).json(config);
  });
});

router.post('/', (req: Request<unknown, unknown, LlmConfig>, res: Response) => {
  withDbWrite(async (db) => {
    upsertLlmConfig(db, req.body);
    const updated = getLlmConfig(db);
    res.status(200).json(updated);
  });
});

export default router;
