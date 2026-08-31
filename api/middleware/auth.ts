import type { Request, Response, NextFunction } from 'express';

export function requireApiKey(_req: Request, res: Response, next: NextFunction): void {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    next();
    return;
  }

  const provided = _req.headers['x-api-key'] as string | undefined;
  if (provided === apiKey) {
    next();
    return;
  }

  res.status(401).json({ success: false, error: 'Unauthorized' });
}

export function adminOnly(_req: Request, res: Response, next: NextFunction): void {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    next();
    return;
  }

  const provided = _req.headers['x-api-key'] as string | undefined;
  if (provided === apiKey) {
    next();
    return;
  }

  res.status(401).json({ success: false, error: 'Unauthorized' });
}
