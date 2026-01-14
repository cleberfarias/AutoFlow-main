import { generateResponse } from './llmResponder';
import * as ChatAction from '../server/chatAction';

export type Action = {
  type: string;
  params?: Record<string, any>;
};

export type RunResult = {
  ok: boolean;
  type: string;
  text?: string;
  raw?: any;
};

function replaceVariables(template: string, ctx: Record<string, any> = {}) {
  if (!template) return template;
  return template.replace(/\{\s*([A-Z0-9_]+)\s*\}/g, (_, key) => {
    return ctx[key] ?? '';
  });
}

export async function runAction(action: Action, context: Record<string, any> = {}): Promise<RunResult> {
  if (!action || !action.type) return { ok: false, type: 'unknown' };

  switch (action.type) {
    case 'ASSISTANT_GPT': {
      const promptTemplate = action.params?.prompt || action.params?.template || '{MSG_TEXT}';
      const systemPrompt = action.params?.systemPrompt;
      const prompt = replaceVariables(promptTemplate, context);
      const model = action.params?.model;
      const maxTokens = action.params?.maxTokens;
      const text = await generateResponse(prompt, { model, maxTokens, systemPrompt });
      // record audit
      try {
        await ChatAction.recordChatAction({ chatId: context.chatId || null, intentId: context.intentId || null, intentScore: context.intentScore ?? null, actionType: 'ASSISTANT_GPT', text, timestamp: new Date().toISOString() });
      } catch (err) {
        // ignore recording failures
      }
      // metrics: action executed
      try {
        const { increment } = await import('../server/metrics');
        increment('actions_executed', 1);
      } catch (e) {
        try {
          globalThis.__AUTOFLOW_METRICS__ = globalThis.__AUTOFLOW_METRICS__ || {};
          globalThis.__AUTOFLOW_METRICS__.actions_executed = (globalThis.__AUTOFLOW_METRICS__.actions_executed || 0) + 1;
        } catch (e2) {}
      }
      return { ok: true, type: 'ASSISTANT_GPT', text, raw: null };
    }

    case 'RESPONDER': {
      const t = action.params?.text || '';
      const text = replaceVariables(t, context);
      try {
        await ChatAction.recordChatAction({ chatId: context.chatId || null, intentId: context.intentId || null, intentScore: context.intentScore ?? null, actionType: 'RESPONDER', text, timestamp: new Date().toISOString() });
      } catch (err) {
        // ignore
      }
      try {
        const { increment } = await import('../server/metrics');
        increment('actions_executed', 1);
      } catch (e) {
        try {
          globalThis.__AUTOFLOW_METRICS__ = globalThis.__AUTOFLOW_METRICS__ || {};
          globalThis.__AUTOFLOW_METRICS__.actions_executed = (globalThis.__AUTOFLOW_METRICS__.actions_executed || 0) + 1;
        } catch (e2) {}
      }
      return { ok: true, type: 'RESPONDER', text };
    }

    case 'TAG': {
      const tag = action.params?.tag || action.params?.name || null;
      if (!tag) return { ok: false, type: 'TAG', raw: 'missing_tag' };
      try {
        const { addTag } = await import('../server/tags');
        const tags = await addTag(context.chatId || null, tag);
        await ChatAction.recordChatAction({ chatId: context.chatId || null, intentId: context.intentId || null, intentScore: context.intentScore ?? null, actionType: 'TAG', text: tag, timestamp: new Date().toISOString() });
        try {
          const { increment } = await import('../server/metrics');
          increment('actions_executed', 1);
        } catch (e) {}
        return { ok: true, type: 'TAG', text: tag, raw: tags };
      } catch (err) {
        return { ok: false, type: 'TAG', raw: String(err) };
      }
    }

    case 'ENCAMINHAR': {
      const target = action.params?.target || action.params?.to || null;
      const messageTemplate = action.params?.message || action.params?.text || '{MSG_TEXT}';
      if (!target) return { ok: false, type: 'ENCAMINHAR', raw: 'missing_target' };
      try {
        const msg = replaceVariables(messageTemplate, context);
        const { forwardMessage } = await import('../server/forward.ts');
        const fwd = await forwardMessage(context.chatId || null, target, msg, { meta: action.params?.meta || {} });
        await ChatAction.recordChatAction({ chatId: context.chatId || null, intentId: context.intentId || null, intentScore: context.intentScore ?? null, actionType: 'ENCAMINHAR', text: JSON.stringify({ target, msg }), timestamp: new Date().toISOString() });
        try {
          const { increment } = await import('../server/metrics.js');
          increment('actions_executed', 1);
        } catch (e) {}
        return { ok: true, type: 'ENCAMINHAR', text: msg, raw: fwd };
      } catch (err) {
        return { ok: false, type: 'ENCAMINHAR', raw: String(err) };
      }
    }

    case 'FUNIL': {
      const funnelId = action.params?.funnelId || action.params?.funnel || null;
      const stepId = action.params?.stepId || action.params?.step || null;
      if (!funnelId) return { ok: false, type: 'FUNIL', raw: 'missing_funnelId' };
      try {
        const { setChatFunnel } = await import('../server/funnels');
        const chat = await setChatFunnel(context.chatId || null, funnelId, stepId);
        await ChatAction.recordChatAction({ chatId: context.chatId || null, intentId: context.intentId || null, intentScore: context.intentScore ?? null, actionType: 'FUNIL', text: JSON.stringify({ funnelId, stepId }), timestamp: new Date().toISOString() });
        try { const { increment } = await import('../server/metrics'); increment('actions_executed', 1); } catch (e) {}
        return { ok: true, type: 'FUNIL', text: `${funnelId}:${stepId || ''}`, raw: chat };
      } catch (err) {
        return { ok: false, type: 'FUNIL', raw: String(err) };
      }
    }

    case 'STATUS': {
      const status = action.params?.status || action.params?.value || null;
      if (!status) return { ok: false, type: 'STATUS', raw: 'missing_status' };
      try {
        const { setChatStatus } = await import('../server/status');
        const chat = await setChatStatus(context.chatId || null, status);
        await ChatAction.recordChatAction({ chatId: context.chatId || null, intentId: context.intentId || null, intentScore: context.intentScore ?? null, actionType: 'STATUS', text: status, timestamp: new Date().toISOString() });
        try { const { increment } = await import('../server/metrics.js'); increment('actions_executed', 1); } catch (e) {}
        return { ok: true, type: 'STATUS', text: status, raw: chat };
      } catch (err) {
        return { ok: false, type: 'STATUS', raw: String(err) };
      }
    }

    case 'DELEGAR': {
      // Delegates the chat to an available agent using round-robin
      try {
        const { getNextAgent, assignChat } = await import('../server/agents');
        const agent = await getNextAgent();
        if (!agent) return { ok: false, type: 'DELEGAR', raw: 'no_agent_available' };
        await assignChat(context.chatId || null, agent.id);
        try { const { setChatStatus } = await import('../server/status'); await setChatStatus(context.chatId || null, `assigned:${agent.id}`); } catch (e) {}
        const text = action.params?.message ? replaceVariables(action.params.message, context) : `Conectando você a ${agent.name}`;
        // send notification/forward to agent so they can accept/reject
        try {
          const { forwardMessage } = await import('../server/forward.ts');
          const notif = await forwardMessage(context.chatId || null, agent.id, JSON.stringify({ type: 'delegation', chatId: context.chatId, message: text, agentId: agent.id, instructions: 'Responda /accept ou /reject via API' }));
          agent.forward = notif;
        } catch (err) {
          // ignore forward failures
        }
          await ChatAction.recordChatAction({ chatId: context.chatId || null, intentId: context.intentId || null, intentScore: context.intentScore ?? null, actionType: 'DELEGAR', text: `${agent.id}`, timestamp: new Date().toISOString() });
        try { const { increment } = await import('../server/metrics'); increment('actions_executed', 1); } catch (e) {}
        return { ok: true, type: 'DELEGAR', text, raw: agent };
      } catch (err) {
        return { ok: false, type: 'DELEGAR', raw: String(err) };
      }
    }

    case 'TOOL_CALL': {
      // Executa tools do registry MCP-style
      const toolName = action.params?.toolName || action.params?.tool;
      const toolArgs = action.params?.args || action.params?.arguments || {};
      
      if (!toolName) {
        return { ok: false, type: 'TOOL_CALL', raw: 'missing_toolName' };
      }

      try {
        const { callTool } = await import('../server/tools/registry.ts');
        const result = await callTool(toolName, toolArgs, context);
        
        if (!result.success) {
          console.error(`[TOOL_CALL] Failed: ${toolName}`, result.error);
          return { 
            ok: false, 
            type: 'TOOL_CALL', 
            text: `Não foi possível executar ${toolName}: ${result.error}`,
            raw: result 
          };
        }

        // Record action
        try {
          await ChatAction.recordChatAction({ 
            chatId: context.chatId || null, 
            intentId: context.intentId || null, 
            intentScore: context.intentScore ?? null, 
            actionType: 'TOOL_CALL', 
            text: `${toolName}(${JSON.stringify(toolArgs)})`, 
            timestamp: new Date().toISOString() 
          });
        } catch (err) {
          // ignore recording failures
        }

        // Metrics
        try {
          const { increment } = await import('../server/metrics.js');
          increment('actions_executed', 1);
        } catch (e) {
          try {
            globalThis.__AUTOFLOW_METRICS__ = globalThis.__AUTOFLOW_METRICS__ || {};
            globalThis.__AUTOFLOW_METRICS__.actions_executed = (globalThis.__AUTOFLOW_METRICS__.actions_executed || 0) + 1;
          } catch (e2) {}
        }

        return { 
          ok: true, 
          type: 'TOOL_CALL', 
          text: `Tool ${toolName} executada com sucesso`,
          raw: result.result 
        };
      } catch (err: any) {
        console.error('[TOOL_CALL] Exception:', err);
        return { 
          ok: false, 
          type: 'TOOL_CALL', 
          text: 'Erro ao executar ferramenta',
          raw: err?.message || String(err) 
        };
      }
    }

    default:
      return { ok: false, type: 'unsupported' };
  }
}
