import { describe, it, expect } from 'vitest';

describe('Ticket Creation Tool', () => {
  it('creates a ticket successfully', async () => {
    const { createTicketTool } = await import('../api/services/tools/tickets');
    const mockDb = createMockDb();
    const result = await createTicketTool(mockDb, {
      session_id: 'test-session',
      language: 'en',
      category: 'delivery_issue',
      description: 'Item arrived damaged',
      order_number: 'ORD-10001',
    });
    
    expect(result.ticket_id).toBeDefined();
    expect(result.status).toBe('open');
    expect(result.error).toBeUndefined();
  });

  it('creates ticket without order number', async () => {
    const { createTicketTool } = await import('../api/services/tools/tickets');
    const mockDb = createMockDb();
    const result = await createTicketTool(mockDb, {
      session_id: 'test-session-2',
      language: 'en',
      category: 'returns_refunds',
      description: 'Want to return item',
    });
    
    expect(result.ticket_id).toBeDefined();
    expect(result.status).toBe('open');
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
