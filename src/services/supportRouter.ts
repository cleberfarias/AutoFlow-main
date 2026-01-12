/**
 * Support Router - Sistema de Roteamento Inteligente para Suporte ChatGuru
 * 
 * Implementa hierarquia de IA com:
 * - Camada 0: Regras rápidas sem IA (GREETING, THANKS, comandos)
 * - Camada 1: Chamada ao LLM via /api/support-router para casos complexos
 * 
 * Gerencia sessões e estados de conversação (START/MIDDLE/COOLDOWN/END/HUMAN)
 */

import {
  getSession,
  saveSession,
  addMessageToHistory,
  getRecentHistory,
  SessionState,
  SessionStage,
  SupportIntent,
  Severity
} from './session';

// Schema de resposta da API
export interface SupportRouterResponse {
  intent: SupportIntent;
  confidence: number;
  severity: Severity;
  stage_next: SessionStage;
  action: 'REPLY' | 'ASK' | 'CHECKLIST' | 'HANDOFF';
  missing_slots: string[];
  reply: string;
  checklist: string[];
  handoff_reason: string;
}

// Resposta processada para o UI
export interface SupportUIResponse {
  replyText: string;
  action: 'REPLY' | 'ASK' | 'CHECKLIST' | 'HANDOFF';
  checklist: string[];
  stageNext: SessionStage;
  intent: SupportIntent;
  severity: Severity;
  confidence: number;
  handoffReason?: string;
}

/**
 * CAMADA 0: Regras rápidas sem IA
 * Retorna resposta imediata para padrões simples
 */
function applyLayer0Rules(message: string): SupportUIResponse | null {
  const lowerMsg = message.toLowerCase().trim();
  
  // Apenas emojis ou muito curto
  if (lowerMsg.length === 0 || /^[👍👎😊😀🙏✅❌🎉💪🔥]+$/.test(lowerMsg)) {
    return {
      replyText: '👍 Entendi! Como posso ajudar?',
      action: 'REPLY',
      checklist: [],
      stageNext: 'END',
      intent: 'GREETING',
      severity: 'LOW',
      confidence: 1.0
    };
  }

  // Saudações simples
  if (/^(oi|olá|ola|hey|hi|hello|bom dia|boa tarde|boa noite|e aí|eai)$/i.test(lowerMsg)) {
    return {
      replyText: 'Olá! 👋 Sou o assistente do ChatGuru. Como posso ajudar você hoje?',
      action: 'REPLY',
      checklist: [],
      stageNext: 'START',
      intent: 'GREETING',
      severity: 'LOW',
      confidence: 1.0
    };
  }

  // Agradecimentos
  if (/^(obrigado|obrigada|valeu|vlw|thanks|thank you|brigado)$/i.test(lowerMsg)) {
    return {
      replyText: 'Por nada! 😊 Estou aqui se precisar de mais alguma coisa.',
      action: 'REPLY',
      checklist: [],
      stageNext: 'END',
      intent: 'THANKS',
      severity: 'LOW',
      confidence: 1.0
    };
  }

  // Confirmações simples
  if (/^(ok|okay|beleza|certo|sim|yes|entendi|perfeito|show)$/i.test(lowerMsg)) {
    return {
      replyText: 'Ótimo! Mais alguma dúvida?',
      action: 'REPLY',
      checklist: [],
      stageNext: 'END',
      intent: 'THANKS',
      severity: 'LOW',
      confidence: 1.0
    };
  }

  // Pedido explícito por atendente humano
  if (/(falar com|chamar|quero|preciso de).*(atendente|humano|pessoa|alguém|alguem)/i.test(lowerMsg) ||
      /(atendente|humano|pessoa).*(urgente|agora|já|ja)/i.test(lowerMsg)) {
    return {
      replyText: 'Entendi. Vou transferir você para um atendente humano. Por favor, aguarde um momento.',
      action: 'HANDOFF',
      checklist: [],
      stageNext: 'HUMAN',
      intent: 'HUMAN',
      severity: 'MEDIUM',
      confidence: 1.0,
      handoffReason: 'Solicitação explícita do usuário'
    };
  }

  // Não encontrou padrão simples, precisa da IA
  return null;
}

/**
 * CAMADA 1: Chama a API backend para análise com LLM
 */
async function callSupportRouterAPI(
  chatId: string,
  userMessage: string,
  session: SessionState
): Promise<SupportRouterResponse> {
  try {
    // Preparar contexto da sessão
    const recentHistory = getRecentHistory(session, 5);
    
    const payload = {
      chatId,
      userMessage,
      currentStage: session.stage,
      currentIntent: session.intent,
      currentSlots: session.slots,
      history: recentHistory,
      confidence: session.confidence,
      severity: session.severity
    };

    console.log('[SupportRouter] Chamando API:', payload);

    const response = await fetch('/api/support-router', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data: SupportRouterResponse = await response.json();
    console.log('[SupportRouter] Resposta da API:', data);

    return data;
  } catch (error) {
    console.error('[SupportRouter] Erro ao chamar API:', error);
    
    // Fallback: retorna resposta de handoff em caso de erro
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      severity: 'HIGH',
      stage_next: 'HUMAN',
      action: 'HANDOFF',
      missing_slots: [],
      reply: 'Desculpe, estou com dificuldades técnicas no momento. Vou transferir você para um atendente.',
      checklist: [],
      handoff_reason: 'Erro técnico no sistema de IA'
    };
  }
}

/**
 * Função principal: processa mensagem do usuário e retorna resposta
 */
export async function handleMessage(
  chatId: string,
  userMessage: string
): Promise<SupportUIResponse> {
  try {
    // 1. Carregar sessão atual
    let session = getSession(chatId);
    
    // 2. Adicionar mensagem do usuário ao histórico
    session = addMessageToHistory(session, 'user', userMessage);

    // 3. Tentar Camada 0 (regras rápidas)
    const layer0Response = applyLayer0Rules(userMessage);
    if (layer0Response) {
      console.log('[SupportRouter] Resolvido pela Camada 0');
      
      // Atualizar sessão
      session.stage = layer0Response.stageNext;
      session.intent = layer0Response.intent;
      session.confidence = layer0Response.confidence;
      session.severity = layer0Response.severity;
      
      // Adicionar resposta ao histórico
      session = addMessageToHistory(session, 'assistant', layer0Response.replyText);
      
      // Salvar sessão
      saveSession(chatId, session);
      
      return layer0Response;
    }

    // 4. Camada 1: Chamar API com LLM
    console.log('[SupportRouter] Camada 0 não resolveu, chamando API...');
    const apiResponse = await callSupportRouterAPI(chatId, userMessage, session);

    // 5. Processar resposta da API
    session.stage = apiResponse.stage_next;
    session.intent = apiResponse.intent;
    session.confidence = apiResponse.confidence;
    session.severity = apiResponse.severity;

    // 6. Atualizar slots se houver missing_slots
    if (apiResponse.missing_slots.length > 0) {
      session.stage = 'COOLDOWN'; // Esperando dados complementares
      apiResponse.missing_slots.forEach(slot => {
        if (!(slot in session.slots)) {
          session.slots[slot] = null;
        }
      });
    }

    // 7. Adicionar resposta ao histórico
    session = addMessageToHistory(session, 'assistant', apiResponse.reply);

    // 8. Salvar sessão atualizada
    saveSession(chatId, session);

    // 9. Retornar resposta formatada para o UI
    const uiResponse: SupportUIResponse = {
      replyText: apiResponse.reply,
      action: apiResponse.action,
      checklist: apiResponse.checklist,
      stageNext: apiResponse.stage_next,
      intent: apiResponse.intent,
      severity: apiResponse.severity,
      confidence: apiResponse.confidence,
      handoffReason: apiResponse.handoff_reason
    };

    return uiResponse;
  } catch (error) {
    console.error('[SupportRouter] Erro ao processar mensagem:', error);
    
    // Em caso de erro crítico, retornar fallback
    return {
      replyText: 'Desculpe, ocorreu um erro inesperado. Por favor, tente novamente ou aguarde que vou transferir para um atendente.',
      action: 'HANDOFF',
      checklist: [],
      stageNext: 'HUMAN',
      intent: 'UNKNOWN',
      severity: 'HIGH',
      confidence: 0,
      handoffReason: 'Erro crítico no sistema'
    };
  }
}

/**
 * Reseta uma conversa (útil quando stage_next=END e usuário inicia novo assunto)
 */
export function resetConversation(chatId: string): void {
  const session = getSession(chatId);
  session.stage = 'START';
  session.intent = null;
  session.confidence = 0;
  session.severity = 'LOW';
  session.slots = {};
  // Mantém histórico mas reseta estado
  saveSession(chatId, session);
  console.log('[SupportRouter] Conversa resetada para chatId:', chatId);
}

/**
 * Obtém status atual da sessão (útil para debugging ou UI)
 */
export function getSessionStatus(chatId: string): {
  stage: SessionStage;
  intent: SupportIntent | null;
  confidence: number;
  severity: Severity;
  messagesCount: number;
  slots: Record<string, any>;
} {
  const session = getSession(chatId);
  return {
    stage: session.stage,
    intent: session.intent,
    confidence: session.confidence,
    severity: session.severity,
    messagesCount: session.history.length,
    slots: session.slots
  };
}
