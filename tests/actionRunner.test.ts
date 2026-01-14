import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as AR from '../services/actionRunner';
import * as LLM from '../services/llmResponder';
import * as ChatAction from '../server/chatAction';

vi.mock('../services/llmResponder');
vi.mock('../server/chatAction');

describe('actionRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs ASSISTANT_GPT action and returns LLM text', async () => {
    (LLM.generateResponse as unknown as any).mockResolvedValueOnce('Claro! Qual produto você quer?');
    (ChatAction.recordChatAction as unknown as any).mockResolvedValueOnce({ id: 'ca_1' });

    const action = { type: 'ASSISTANT_GPT', params: { prompt: 'O cliente disse: "{MSG_TEXT}". Responda curto.' } };
    const ctx = { MSG_TEXT: 'Quanto custa o zapgpt?' };
    const res = await AR.runAction(action as any, ctx as any);
    expect(res.ok).toBeTruthy();
    expect(res.type).toBe('ASSISTANT_GPT');
    expect(res.text).toBe('Claro! Qual produto você quer?');
    expect(LLM.generateResponse).toHaveBeenCalledWith('O cliente disse: "Quanto custa o zapgpt?". Responda curto.', expect.any(Object));
    expect(ChatAction.recordChatAction).toHaveBeenCalled();
  });

  it('runs RESPONDER action performing variable replacement', async () => {
    (ChatAction.recordChatAction as unknown as any).mockResolvedValueOnce({ id: 'ca_2' });
    const action = { type: 'RESPONDER', params: { text: 'Olá {FIRST_NAME}, em que posso ajudar?' } };
    const res = await AR.runAction(action as any, { FIRST_NAME: 'Cleber' } as any);
    expect(res.ok).toBeTruthy();
    expect(res.type).toBe('RESPONDER');
    expect(res.text).toBe('Olá Cleber, em que posso ajudar?');
    expect(ChatAction.recordChatAction).toHaveBeenCalled();
  });

  it('runs TAG action and records tag', async () => {
    (ChatAction.recordChatAction as unknown as any).mockResolvedValueOnce({ id: 'ca_tag' });
    const TagModule = await import('../server/tags.js');
    const addSpy = vi.spyOn(TagModule, 'addTag').mockResolvedValueOnce(['important']);
    const action = { type: 'TAG', params: { tag: 'important' } };
    const res = await AR.runAction(action as any, { chatId: 'u100' } as any);
    expect(res.ok).toBeTruthy();
    expect(res.type).toBe('TAG');
    expect(res.text).toBe('important');
    expect(addSpy).toHaveBeenCalledWith('u100', 'important');
    addSpy.mockRestore();
  });

  it('runs ENCAMINHAR action and records forward', async () => {
    (ChatAction.recordChatAction as unknown as any).mockResolvedValueOnce({ id: 'ca_forward' });
    const FwdModule = await import('../server/forward.ts');
    const fwdSpy = (vi.spyOn(FwdModule, 'forwardMessage') as any).mockResolvedValueOnce({ id: 'f1' } as any);
    const action = { type: 'ENCAMINHAR', params: { target: 'agent:123', message: 'Encaminhando: {MSG_TEXT}' } };
    const res = await AR.runAction(action as any, { chatId: 'u200', MSG_TEXT: 'Olá' } as any);
    expect(res.ok).toBeTruthy();
    expect(res.type).toBe('ENCAMINHAR');
    expect(res.text).toBe('Encaminhando: Olá');
    expect(fwdSpy).toHaveBeenCalledWith('u200', 'agent:123', 'Encaminhando: Olá', expect.any(Object));
    fwdSpy.mockRestore();
  });

  it('runs FUNIL action and updates chat funnel', async () => {
    (ChatAction.recordChatAction as unknown as any).mockResolvedValueOnce({ id: 'ca_funnel' });
    const Funnels = await import('../server/funnels.js');
    const setSpy = vi.spyOn(Funnels, 'setChatFunnel').mockResolvedValueOnce({ funnelId: 'sales', funnelStepId: 'lead' });
    const action = { type: 'FUNIL', params: { funnelId: 'sales', stepId: 'lead' } };
    const res = await AR.runAction(action as any, { chatId: 'u300' } as any);
    expect(res.ok).toBeTruthy();
    expect(res.type).toBe('FUNIL');
    expect(setSpy).toHaveBeenCalledWith('u300', 'sales', 'lead');
    setSpy.mockRestore();
  });

  it('runs STATUS action and updates chat status', async () => {
    (ChatAction.recordChatAction as unknown as any).mockResolvedValueOnce({ id: 'ca_status' });
    const Status = await import('../server/status.js');
    const setSpy = vi.spyOn(Status, 'setChatStatus').mockResolvedValueOnce({ status: 'waiting' });
    const action = { type: 'STATUS', params: { status: 'waiting' } };
    const res = await AR.runAction(action as any, { chatId: 'u400' } as any);
    expect(res.ok).toBeTruthy();
    expect(res.type).toBe('STATUS');
    expect(setSpy).toHaveBeenCalledWith('u400', 'waiting');
    setSpy.mockRestore();
  });
});
