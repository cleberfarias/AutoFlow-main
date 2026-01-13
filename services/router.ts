// Router de pirâmide de custo para otimizar uso de LLM
// Camada 0: Templates zero-token (greetings/confirmations)
// Camada 1: Heurística barata (intentService)
// Camada 2: LLM JSON (support-router)
// Camada 3: Fallback LLM full (llmResponder)

type RouterOutput = {
  type: 'reply' | 'action' | 'tool_call' | 'handoff';
  payload: any;
  meta: {
    tier: 'RULES' | 'HEURISTIC' | 'LLM_JSON' | 'LLM_FULL';
    confidence: number;
  };
};

// Camada 0: Templates zero-token (maior prioridade)
const ZERO_TOKEN_RULES: Record<string, { patterns: string[]; response: string }> = {
  greeting_morning: {
    patterns: ['bom dia', 'bomdia'],
    response: 'Bom dia! Como posso ajudar você hoje? 😊'
  },
  greeting_afternoon: {
    patterns: ['boa tarde', 'boatarde'],
    response: 'Boa tarde! Em que posso ser útil? 😊'
  },
  greeting_evening: {
    patterns: ['boa noite', 'boanoite'],
    response: 'Boa noite! Como posso ajudar? 😊'
  },
  confirmation_ok: {
    patterns: ['ok', 'certo', 'beleza', 'blz', 'entendi', 'legal'],
    response: 'Ótimo! Precisa de mais alguma coisa?'
  },
  thanks: {
    patterns: ['obrigado', 'obrigada', 'valeu', 'vlw', 'agradeço'],
    response: 'Por nada! Estou aqui sempre que precisar. 😊'
  },
  goodbye: {
    patterns: ['tchau', 'até mais', 'ate mais', 'até logo', 'falou', 'flw', 'adeus'],
    response: 'Até breve! Tenha um ótimo dia! 👋'
  }
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^\w\s]/g, ' ') // remove pontuação
    .replace(/\s+/g, ' ')
    .trim();
}

function checkZeroTokenRules(text: string): { match: boolean; response?: string } {
  const normalized = normalizeText(text);
  
  for (const rule of Object.values(ZERO_TOKEN_RULES)) {
    for (const pattern of rule.patterns) {
      if (normalized === normalizeText(pattern)) {
        return { match: true, response: rule.response };
      }
    }
  }
  
  return { match: false };
}

// Threshold para decidir escalar para LLM
const INTENT_CONFIDENCE_THRESHOLD = 0.6;

export async function routeMessage(
  text: string, 
  context: { chatId: string; [key: string]: any }
): Promise<RouterOutput> {
  // CAMADA 0: Templates zero-token
  const zeroTokenMatch = checkZeroTokenRules(text);
  if (zeroTokenMatch.match) {
    return {
      type: 'reply',
      payload: { text: zeroTokenMatch.response },
      meta: { tier: 'RULES', confidence: 1.0 }
    };
  }

  // CAMADA 1: Heurística barata (intentService)
  try {
    const { detectIntent } = await import('../server/intentService.js');
    const intentResult = await detectIntent(text);
    
    if (intentResult.score >= INTENT_CONFIDENCE_THRESHOLD) {
      // Intent detectada com confiança suficiente
      return {
        type: 'action',
        payload: { 
          intentId: intentResult.intentId,
          intentName: intentResult.intentName,
          score: intentResult.score,
          method: intentResult.method
        },
        meta: { tier: 'HEURISTIC', confidence: intentResult.score }
      };
    }
  } catch (err) {
    console.warn('Intent detection failed, escalating to LLM:', err);
  }

  // CAMADA 2: LLM JSON (support-router para decisões estruturadas)
  try {
    const response = await fetch('/api/support-router', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: text,
        chatId: context.chatId,
        expectJson: true 
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Se support-router retornou decisão estruturada
      if (data.actionType) {
        return {
          type: data.actionType === 'tool_call' ? 'tool_call' : 'action',
          payload: data,
          meta: { tier: 'LLM_JSON', confidence: data.confidence || 0.7 }
        };
      }
    }
  } catch (err) {
    console.warn('LLM JSON router failed, escalating to LLM full:', err);
  }

  // CAMADA 3: Fallback LLM full (resposta natural curta)
  try {
    const { generateResponse } = await import('./llmResponder.js');
    const llmResponse = await generateResponse(text, {
      systemPrompt: 'Você é um assistente de atendimento ao cliente. Seja breve, cordial e objetivo.',
      maxTokens: 150
    });

    return {
      type: 'reply',
      payload: { text: llmResponse },
      meta: { tier: 'LLM_FULL', confidence: 0.5 }
    };
  } catch (err) {
    console.error('All routing tiers failed:', err);
    
    // Fallback final
    return {
      type: 'reply',
      payload: { text: 'Desculpe, não consegui processar sua mensagem no momento. Tente novamente mais tarde.' },
      meta: { tier: 'LLM_FULL', confidence: 0.1 }
    };
  }
}
