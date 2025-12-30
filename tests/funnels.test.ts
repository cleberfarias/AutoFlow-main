import { describe, it, expect } from 'vitest';
import * as F from '../server/funnels';

describe('funnels module', () => {
  it('can create funnel and step and set chat funnel', async () => {
    const f = await F.createFunnel('sales', 'Sales Funnel');
    expect(f.id).toBe('sales');
    const s = await F.addFunnelStep('sales', 'lead', 'Lead');
    expect(s.id).toBe('lead');

    const chat = await F.setChatFunnel('chat1', 'sales', 'lead');
    expect(chat.funnelId).toBe('sales');
    expect(chat.funnelStepId).toBe('lead');

    const got = await F.getChatFunnel('chat1');
    expect(got.funnelId).toBe('sales');
  });
});