import { detectIntent } from '../server/intentService.js';

export type HandlerResult = {
  action?: { type: string; params?: any } | null;
  clarification?: string | null;
  intent?: any;
  proposedAction?: { type: string; params?: any } | null;
};

export async function handleMessage(text: string, context: Record<string, any> = {}): Promise<HandlerResult> {
  const threshold = parseFloat(process.env.INTENT_CONFIDENCE_THRESHOLD || '0.6');
  const intent = await detectIntent(text);

  if (!intent || intent.method === 'fallback') {
    return { action: null, clarification: 'Desculpe, não entendi. Pode reformular?', intent };
  }

  if ((intent.score ?? 0) < threshold) {
    const matchedExample = intent.matchedExample || text;
    // propose an action so we can run it if the user confirms
    let proposedAction = null;
    switch (intent.intentId) {
      case 'greeting':
        proposedAction = { type: 'RESPONDER', params: { text: 'Olá! Como posso ajudar você hoje?' } };
        break;
      case 'price_query':
        proposedAction = { type: 'ASSISTANT_GPT', params: { prompt: 'O cliente perguntou: "{MSG_TEXT}". Responda de forma curta e direta perguntando qual produto ou código.' } };
        break;
      case 'support_request':
        proposedAction = { type: 'RESPONDER', params: { text: 'Parece um pedido de suporte — vou abrir um chamado. Pode descrever o problema com mais detalhes?' } };
        break;
      default:
        proposedAction = null;
    }

    return { action: null, clarification: `Você quis dizer: "${matchedExample}"? Responda SIM para confirmar.`, intent, proposedAction };
  }

  // build action based on intent
  switch (intent.intentId) {
    case 'greeting':
      return { action: { type: 'RESPONDER', params: { text: 'Olá! Como posso ajudar você hoje?' } }, intent };
    case 'price_query':
      return { action: { type: 'ASSISTANT_GPT', params: { prompt: 'O cliente perguntou: "{MSG_TEXT}". Responda de forma curta e direta perguntando qual produto ou código.' } }, intent };
    case 'support_request':
      return { action: { type: 'RESPONDER', params: { text: 'Parece um pedido de suporte — vou abrir um chamado. Pode descrever o problema com mais detalhes?' } }, intent };
    case 'move_to_sales':
      return { action: { type: 'FUNIL', params: { funnelId: 'sales', stepId: 'lead' } }, intent };
    default:
      return { action: null, clarification: 'Desculpe, não sei como ajudar com isso ainda.', intent };
  }
}
