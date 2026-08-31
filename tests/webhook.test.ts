import { describe, it, expect, vi } from 'vitest';
import { validateSharedSecret } from '../api/middleware/webhook';

describe('Webhook Validation', () => {
  it('skips validation when secret is not configured', () => {
    const middleware = validateSharedSecret(undefined);
    const req = { headers: {} } as any;
    const res = { status: () => res, json: () => {} } as any;
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows request with matching secret', () => {
    const middleware = validateSharedSecret('my-secret');
    const req = { headers: { 'x-webhook-secret': 'my-secret' } } as any;
    const res = { status: () => res, json: () => {} } as any;
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects request with wrong secret', () => {
    const middleware = validateSharedSecret('my-secret');
    const req = { headers: { 'x-webhook-secret': 'wrong' } } as any;
    const res = { status: () => res, json: (data: unknown) => { expect(data).toEqual({ success: false, error: 'Invalid webhook secret' }); } } as any;
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects request with missing secret', () => {
    const middleware = validateSharedSecret('my-secret');
    const req = { headers: {} } as any;
    const res = { status: () => res, json: (data: unknown) => { expect(data).toEqual({ success: false, error: 'Invalid webhook secret' }); } } as any;
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});
