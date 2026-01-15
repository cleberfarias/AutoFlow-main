import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import db from '../server/db';

// We'll mock router and registry to control behavior

describe('confirmation flow (inbound)', () => {
  let app: any;
  let calls: Array<any> = [];

  beforeEach(async () => {
    vi.resetModules();
    calls = [];
    // mock router to return tool_call for calendar.createAppointment
    vi.doMock('../services/router', () => ({
      routeMessage: vi.fn(async (text, ctx) => ({ type: 'tool_call', payload: { toolName: 'calendar.createAppointment', args: { when: '15:00' } }, meta: {} }))
    }));
    // mock registry callTool to capture messages and to simulate tool execution
    vi.doMock('../server/tools/registry.ts', () => ({
      callTool: async (toolName: string, args: any, ctx: any) => {
        calls.push({ toolName, args, ctx });
        // if actual calendar tool, return simulated success
        if (toolName === 'calendar.createAppointment') return { success: true, result: { id: 'apt-1' } };
        // otherwise ack send
        return { success: true };
      }
    }));
    app = (await import('../connectors/whatsapp/server')).default;
    if (!db.data) await db.read();
    db.data.forwards = [];
    try { await db.write(); } catch (e) {}
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates confirmation when tool_call needs confirmation and sends prompt', async () => {
    const res = await request(app)
      .post('/api/inbound/message')
      .send({ tenantId: 't1', channel: 'whatsapp', messageId: 'm1', from: 'u1', chatId: 'chat1', text: 'agendar' });

    expect(res.status).toBe(200);
    expect(res.body.confirmationCreated).toBe(true);
    expect(res.body.prompt).toBeTruthy();
    // send message should have been called to send prompt
    const sendCall = calls.find(c => c.toolName && c.toolName.includes('whatsapp'));
    expect(sendCall).toBeTruthy();
  });

  it('executes action on YES and clears confirmation', async () => {
    // create confirmation first
    await request(app)
      .post('/api/inbound/message')
      .send({ tenantId: 't1', channel: 'whatsapp', messageId: 'm1', from: 'u1', chatId: 'chat1', text: 'agendar' });

    // now reply YES
    const res2 = await request(app)
      .post('/api/inbound/message')
      .send({ tenantId: 't1', channel: 'whatsapp', messageId: 'm2', from: 'u1', chatId: 'chat1', text: 'sim' });

    expect(res2.status).toBe(200);
    expect(res2.body.confirmation).toBe(true);
    expect(res2.body.decision).toBe('yes');
    // calendar.createAppointment should have been executed
    const calCall = calls.find(c => c.toolName === 'calendar.createAppointment');
    expect(calCall).toBeTruthy();
    // ensure confirmation cleared by trying to reply again -> should route normally (create new confirmation again)
    const res3 = await request(app)
      .post('/api/inbound/message')
      .send({ tenantId: 't1', channel: 'whatsapp', messageId: 'm3', from: 'u1', chatId: 'chat1', text: 'agendar outra' });
    expect(res3.body.confirmationCreated).toBe(true);
  });
});
