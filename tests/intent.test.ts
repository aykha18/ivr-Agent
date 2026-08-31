import { describe, it, expect } from 'vitest';
import { classifyIntent } from '../api/services/intent';

describe('Intent Classification', () => {
  it('classifies order tracking intent in English', () => {
    const result = classifyIntent('Track my order', 'en');
    expect(result.intent).toBe('order_tracking');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('classifies delivery issue intent in English', () => {
    const result = classifyIntent('My item arrived damaged', 'en');
    expect(result.intent).toBe('delivery_issue');
  });

  it('classifies returns refunds intent in English', () => {
    const result = classifyIntent('I want to return this', 'en');
    expect(result.intent).toBe('returns_refunds');
  });

  it('classifies agent support intent in English', () => {
    const result = classifyIntent('I want to speak to an agent', 'en');
    expect(result.intent).toBe('agent_support');
  });

  it('classifies unknown intent for unrecognized input', () => {
    const result = classifyIntent('hello world', 'en');
    expect(result.intent).toBe('unknown');
  });

  it('extracts order number slots', () => {
    const result = classifyIntent('Track order ORD-10001', 'en');
    expect(result.slots.order_number).toBe('ord-10001');
  });

  it('classifies in Arabic', () => {
    const result = classifyIntent('تتبع طلبي', 'ar');
    expect(result.intent).toBe('order_tracking');
  });

  it('classifies in Urdu', () => {
    const result = classifyIntent('میرا آرڈر ٹریک کریں', 'ur');
    expect(result.intent).toBe('order_tracking');
  });
});
