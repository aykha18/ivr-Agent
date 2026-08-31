import { describe, it, expect } from 'vitest';

describe('Order Lookup Tool', () => {
  it('finds existing order by order number', async () => {
    const { orderLookup } = await import('../api/services/tools/orders');
    const mockDb = createMockDb();
    const result = await orderLookup(mockDb, {
      order_number: 'ORD-10001',
      language: 'en',
    }, 'test-session');
    
    expect(result.found).toBe(true);
    expect(result.order?.order_number).toBe('ORD-10001');
    expect(result.order?.status).toBe('shipped');
  });

  it('returns not found for unknown order', async () => {
    const { orderLookup } = await import('../api/services/tools/orders');
    const mockDb = createMockDb();
    const result = await orderLookup(mockDb, {
      order_number: 'ORD-99999',
      language: 'en',
    }, 'test-session');
    
    expect(result.found).toBe(false);
  });

  it('lookup by phone number', async () => {
    const { orderLookup } = await import('../api/services/tools/orders');
    const mockDb = createMockDb();
    const result = await orderLookup(mockDb, {
      phone: '+15550123',
      language: 'en',
    }, 'test-session');
    
    expect(result.found).toBe(true);
    expect(result.order?.order_number).toBe('ORD-10001');
  });
});

function createMockDb() {
  return {
    prepare: () => ({
      bind: () => {},
      step: () => false,
      getAsObject: () => ({}),
      free: () => {},
    }),
    run: () => {},
    exec: () => {},
    export: () => new Uint8Array(),
  };
}
