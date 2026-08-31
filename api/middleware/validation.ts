import { z } from 'zod';

export const CreateSessionSchema = z.object({
  channel: z.enum(['simulator', 'twilio', 'asterisk', 'sip', 'yeastar']).optional(),
});

export const SetLanguageSchema = z.object({
  language: z.enum(['en', 'ar', 'ur']),
});

export const TurnRequestSchema = z.object({
  input_type: z.enum(['text', 'audio', 'dtmf']),
  text: z.string().max(2000).optional(),
  dtmf: z.string().max(100).optional(),
  audio_ref: z.string().max(500).optional(),
});

export const CallbackRequestSchema = z.object({
  phone: z.string().max(50).optional(),
  reason: z.string().max(500),
  preferred_time: z.string().max(100).optional(),
});

export const LlmConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'ollama', 'mock', 'gemini', 'groq']),
  model: z.string().min(1).max(100),
  api_url: z.string().url().max(500).optional().nullable(),
  api_key: z.string().max(200).optional().nullable(),
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().int().min(1).max(4096),
  enabled: z.boolean(),
});

export function validate(schema: z.ZodSchema) {
  return (req: { body: unknown }, res: { status: (code: number) => { json: (data: unknown) => void } }, next: () => void) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: (err as z.ZodError).issues });
      } else {
        res.status(400).json({ success: false, error: 'Invalid request body' });
      }
    }
  };
}
