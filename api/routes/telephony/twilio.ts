import { Router, type Request, type Response } from 'express';
import { validateTwilioSignature } from '../../middleware/webhook.js';
import type { LanguageCode } from '../../../shared/types.js';

const router = Router();

router.post(
  '/voice',
  validateTwilioSignature,
  (_req: Request, res: Response) => {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="/api/telephony/twilio/gather" numDigits="1" timeout="5">
    <Say voice="alice">Welcome! For English, press 1. For Arabic, press 2. For Urdu, press 3.</Say>
  </Gather>
  <Say voice="alice">We didn't receive any input. Goodbye.</Say>
</Response>`;
    res.type('text/xml');
    res.send(twiml);
  },
);

router.post(
  '/gather',
  validateTwilioSignature,
  (req: Request, res: Response) => {
    const digits = req.body.Digits as string | undefined;

    let language: LanguageCode = 'en';
    if (digits === '1') language = 'en';
    else if (digits === '2') language = 'ar';
    else if (digits === '3') language = 'ur';

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">You selected ${language}. Please say your request after the beep.</Say>
  <Record action="/api/telephony/twilio/record" maxLength="30" timeout="5" />
</Response>`;
    res.type('text/xml');
    res.send(twiml);
  },
);

router.post(
  '/record',
  validateTwilioSignature,
  (_req: Request, res: Response) => {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you. We received your message.</Say>
</Response>`;
    res.type('text/xml');
    res.send(twiml);
  },
);

export default router;
