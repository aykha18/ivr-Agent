import type { Request, Response, NextFunction } from 'express';

export async function validateTwilioSignature(_req: Request, res: Response, next: NextFunction): Promise<void> {
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  if (!twilioAuthToken) {
    next();
    return;
  }

  const signature = _req.headers['x-twilio-signature'] as string | undefined;
  if (!signature) {
    res.status(403).json({ success: false, error: 'Missing Twilio signature' });
    return;
  }

  const url = `${_req.protocol}://${_req.get('host')}${_req.originalUrl}`;
  const params = { ..._req.body };
  
  const crypto = await import('crypto');
  const expectedSignature = crypto
    .createHmac('sha1', twilioAuthToken)
    .update(`${url}${JSON.stringify(params)}`)
    .digest('base64');

  if (signature !== expectedSignature) {
    res.status(403).json({ success: false, error: 'Invalid Twilio signature' });
    return;
  }

  next();
}

export function validateSharedSecret(secret: string | undefined) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (!secret) {
      next();
      return;
    }

    const provided = _req.headers['x-webhook-secret'] as string | undefined;
    if (provided === secret) {
      next();
      return;
    }

    res.status(403).json({ success: false, error: 'Invalid webhook secret' });
  };
}
