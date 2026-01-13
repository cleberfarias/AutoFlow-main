/**
 * AI Router - Sistema de Roteamento Inteligente
 * 
 * Avalia regras de roteamento usando IA ou condições tradicionais
 * e decide qual caminho seguir no workflow
 */

import { getOpenAI } from './openaiClient';

export interface RoutingRule {
  id: string;
  condition: string;
  description: string;
  nextStepId?: string;
  useAI: boolean;
  aiPrompt?: string;
}

export interface RoutingContext {
  message?: string;
  user?: any;
  intent?: string;
  slots?: Record<string, any>;
  history?: any[];
  [key: string]: any;
}

export interface RoutingResult {
  matchedRuleId: string | null;
  confidence: number;
  reason: string;
  nextStepId?: string;
  usedFallback: boolean;
}

/**
 * Avalia uma regra tradicional (JavaScript condition)
 */
function evaluateTraditionalRule(
  rule: RoutingRule,
  context: RoutingContext
): { matches: boolean; error?: string } {
  try {
    // Criar função que avalia a condição no contexto
    const evaluator = new Function(
      ...Object.keys(context),
      `return Boolean(${rule.condition});`
    );
    
    const matches = evaluator(...Object.values(context));
    return { matches };
  } catch (error) {
    console.error(`[AI Router] Erro ao avaliar regra ${rule.id}:`, error);
    return { matches: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Avalia uma regra usando IA
 */
async function evaluateAIRule(
  rule: RoutingRule,
  context: RoutingContext,
  model: string = 'gpt-4o-mini'
): Promise<{ matches: boolean; confidence: number; reason: string }> {
  try {
    const openai = await getOpenAI();
    if (!openai) {
      return { 
        matches: false, 
        confidence: 0, 
        reason: 'OpenAI client não disponível' 
      };
    }

    const systemPrompt = `Você é um assistente de roteamento inteligente. Sua tarefa é analisar o contexto e determinar se uma regra de roteamento se aplica.

IMPORTANTE:
- Responda APENAS com um JSON válido
- Formato: { "matches": true/false, "confidence": 0.0-1.0, "reason": "explicação curta" }
- confidence = quão certo você está da decisão (0.0 = nada certo, 1.0 = totalmente certo)
- reason = em 1-2 frases, explique por que decidiu isso`;

    const userPrompt = `REGRA A AVALIAR:
${rule.description}

PROMPT DA REGRA:
${rule.aiPrompt}

CONTEXTO DISPONÍVEL:
${JSON.stringify(context, null, 2)}

Analise o contexto e determine se esta regra se aplica. Retorne JSON.`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { 
        matches: false, 
        confidence: 0, 
        reason: 'IA não retornou resposta' 
      };
    }

    const result = JSON.parse(content);
    return {
      matches: Boolean(result.matches),
      confidence: Number(result.confidence) || 0,
      reason: String(result.reason) || 'Sem explicação'
    };

  } catch (error) {
    console.error(`[AI Router] Erro ao avaliar regra AI ${rule.id}:`, error);
    return { 
      matches: false, 
      confidence: 0, 
      reason: `Erro: ${error instanceof Error ? error.message : 'Unknown'}` 
    };
  }
}

/**
 * Executa o roteamento avaliando todas as regras
 */
export async function executeRouting(
  rules: RoutingRule[],
  context: RoutingContext,
  options: {
    aiModel?: string;
    confidenceThreshold?: number;
    fallbackRoute?: 'continue' | 'end' | 'human' | 'default';
  } = {}
): Promise<RoutingResult> {
  const {
    aiModel = 'gpt-4o-mini',
    confidenceThreshold = 0.7,
    fallbackRoute = 'continue'
  } = options;

  console.log('[AI Router] Executando roteamento:', {
    rulesCount: rules.length,
    context: Object.keys(context),
    options
  });

  // Avaliar regras em ordem
  for (const rule of rules) {
    console.log(`[AI Router] Avaliando regra: ${rule.description} (${rule.useAI ? 'AI' : 'Tradicional'})`);

    if (rule.useAI) {
      // Regra com IA
      if (!rule.aiPrompt?.trim()) {
        console.warn(`[AI Router] Regra ${rule.id} usa IA mas não tem prompt definido`);
        continue;
      }

      const result = await evaluateAIRule(rule, context, aiModel);
      console.log(`[AI Router] Resultado AI:`, result);

      if (result.matches && result.confidence >= confidenceThreshold) {
        return {
          matchedRuleId: rule.id,
          confidence: result.confidence,
          reason: result.reason,
          nextStepId: rule.nextStepId,
          usedFallback: false
        };
      }

    } else {
      // Regra tradicional
      if (!rule.condition?.trim()) {
        console.warn(`[AI Router] Regra ${rule.id} não tem condição definida`);
        continue;
      }

      const result = evaluateTraditionalRule(rule, context);
      console.log(`[AI Router] Resultado tradicional:`, result);

      if (result.matches) {
        return {
          matchedRuleId: rule.id,
          confidence: 1.0,
          reason: `Condição "${rule.condition}" avaliada como verdadeira`,
          nextStepId: rule.nextStepId,
          usedFallback: false
        };
      }
    }
  }

  // Nenhuma regra deu match - usar fallback
  console.log(`[AI Router] Nenhuma regra deu match, usando fallback: ${fallbackRoute}`);
  
  return {
    matchedRuleId: null,
    confidence: 0,
    reason: `Nenhuma regra correspondeu, usando fallback: ${fallbackRoute}`,
    nextStepId: undefined,
    usedFallback: true
  };
}

/**
 * Função helper para testar uma regra
 */
export async function testRule(
  rule: RoutingRule,
  context: RoutingContext,
  aiModel: string = 'gpt-4o-mini'
): Promise<{ matches: boolean; confidence: number; reason: string; error?: string }> {
  if (rule.useAI) {
    return await evaluateAIRule(rule, context, aiModel);
  } else {
    const result = evaluateTraditionalRule(rule, context);
    return {
      matches: result.matches,
      confidence: result.matches ? 1.0 : 0,
      reason: result.error || (result.matches ? 'Condição verdadeira' : 'Condição falsa'),
      error: result.error
    };
  }
}
