/**
 * Vercel Serverless Function: Support Router
 * 
 * Endpoint que recebe requisições do frontend e usa OpenAI (gpt-4o-mini)
 * para classificar intenções e gerar respostas estruturadas em JSON.
 * 
 * IMPORTANTE: OPENAI_API_KEY deve estar configurada nas variáveis de ambiente da Vercel
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Types para requisição e resposta
interface SupportRouterRequest {
  chatId: string;
  userMessage: string;
  currentStage: string;
  currentIntent: string | null;
  currentSlots: Record<string, any>;
  history: Array<{ role: string; content: string }>;
  confidence: number;
  severity: string;
}

interface SupportRouterResponse {
  intent: string;
  confidence: number;
  severity: string;
  stage_next: string;
  action: string;
  missing_slots: string[];
  reply: string;
  checklist: string[];
  handoff_reason: string;
}

// Fallback response para erros
const FALLBACK_RESPONSE: SupportRouterResponse = {
  intent: 'UNKNOWN',
  confidence: 0,
  severity: 'HIGH',
  stage_next: 'HUMAN',
  action: 'HANDOFF',
  missing_slots: [],
  reply: 'Desculpe, estou com dificuldades técnicas. Vou transferir você para um atendente humano.',
  checklist: [],
  handoff_reason: 'Erro técnico ao processar requisição'
};

/**
 * System prompt para o LLM
 * Define comportamento, formato de resposta e regras de negócio
 */
const SYSTEM_PROMPT = `Você é um assistente de suporte técnico especializado no ChatGuru, uma plataforma de automação de WhatsApp.

**SUA MISSÃO:** Classificar a intenção do usuário e gerar respostas estruturadas em JSON.

**DOMÍNIO DO CHATGURU:**
- AUTH_LOGIN: Problemas de login, senha, autenticação
- WHATSAPP_CONNECT: Conexão/desconexão do WhatsApp, QR Code
- MESSAGES: Envio/recebimento de mensagens, histórico
- CONTACTS_CHATS: Gestão de contatos, conversas, listas
- AUTOMATIONS_N8N: Criação/edição de automações, workflows, n8n
- INTEGRATIONS: Integrações com APIs externas, webhooks
- BILLING: Planos, pagamentos, faturas, upgrades
- BUG_REPORT: Relato de bugs, erros técnicos
- FEATURE_REQUEST: Solicitação de novas funcionalidades
- HUMAN: Solicita atendimento humano explicitamente
- GREETING: Saudações iniciais
- THANKS: Agradecimentos
- UNKNOWN: Intenção não identificada

**REGRAS OBRIGATÓRIAS:**
1. Responda APENAS com JSON válido, sem markdown, sem explicações
2. Saudações simples → intent=GREETING, action=REPLY, stage_next=END
3. Pedido por humano → intent=HUMAN, action=HANDOFF, stage_next=HUMAN
4. BILLING ou severity=HIGH → preferir HANDOFF
5. confidence < 0.6 → action=ASK com 1 pergunta objetiva, stage_next=COOLDOWN
6. Problemas comuns → action=CHECKLIST com max 4 passos práticos
7. NUNCA invente dados técnicos (links, credenciais, códigos)
8. Se faltar informação → preencha missing_slots e peça no reply
9. Seja conciso: máximo 2 perguntas por reply
10. Contexto: use history para entender continuidade

**SEVERIDADE:**
- LOW: Dúvidas simples, configurações básicas
- MEDIUM: Problemas que afetam uso mas têm solução conhecida
- HIGH: Erro crítico, impossibilidade de usar sistema, billing

**AÇÕES:**
- REPLY: Resposta informativa direta
- ASK: Precisa coletar mais informações
- CHECKLIST: Passo a passo para resolver
- HANDOFF: Transferir para humano

**STAGES:**
- START: Início da conversa
- MIDDLE: Coletando informações
- COOLDOWN: Aguardando dados do usuário (missing_slots)
- END: Problema resolvido ou informação entregue
- HUMAN: Transferido para atendente

**FORMATO JSON (obrigatório):**
{
  "intent": "AUTH_LOGIN|WHATSAPP_CONNECT|...",
  "confidence": 0.85,
  "severity": "LOW|MEDIUM|HIGH",
  "stage_next": "START|MIDDLE|COOLDOWN|END|HUMAN",
  "action": "REPLY|ASK|CHECKLIST|HANDOFF",
  "missing_slots": ["campo1", "campo2"],
  "reply": "Texto da resposta (max 300 caracteres)",
  "checklist": ["Passo 1", "Passo 2", "Passo 3"],
  "handoff_reason": "Motivo para transferir (se action=HANDOFF)"
}

**EXEMPLOS:**

Usuário: "Como faço login?"
{
  "intent": "AUTH_LOGIN",
  "confidence": 0.95,
  "severity": "LOW",
  "stage_next": "MIDDLE",
  "action": "CHECKLIST",
  "missing_slots": [],
  "reply": "Aqui está o passo a passo para fazer login no ChatGuru:",
  "checklist": [
    "Acesse chatguru.com.br",
    "Clique em 'Entrar'",
    "Digite seu email e senha",
    "Clique em 'Acessar'"
  ],
  "handoff_reason": ""
}

Usuário: "WhatsApp não conecta"
{
  "intent": "WHATSAPP_CONNECT",
  "confidence": 0.9,
  "severity": "MEDIUM",
  "stage_next": "COOLDOWN",
  "action": "ASK",
  "missing_slots": ["error_message", "last_connection_time"],
  "reply": "Vou te ajudar. Aparece alguma mensagem de erro? Quando foi a última vez que funcionou?",
  "checklist": [],
  "handoff_reason": ""
}

Usuário: "Quero cancelar meu plano"
{
  "intent": "BILLING",
  "confidence": 0.95,
  "severity": "HIGH",
  "stage_next": "HUMAN",
  "action": "HANDOFF",
  "missing_slots": [],
  "reply": "Entendo que você quer cancelar. Vou transferir para nossa equipe de contas que pode te ajudar melhor com isso.",
  "checklist": [],
  "handoff_reason": "Questão financeira sensível requer atendimento humano"
}

Agora processe a mensagem do usuário seguindo essas regras rigorosamente.`;

/**
 * Chama a API da OpenAI
 */
async function callOpenAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Modelo barato e rápido
      messages,
      temperature: 0.3, // Baixa temperatura para respostas mais consistentes
      max_tokens: 500,
      response_format: { type: 'json_object' } // Força resposta em JSON
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Valida e parse do JSON retornado pelo LLM
 */
function parseAndValidateResponse(jsonString: string): SupportRouterResponse {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Validações básicas
    if (!parsed.intent || !parsed.action || !parsed.stage_next) {
      console.error('[API] JSON inválido:', parsed);
      return FALLBACK_RESPONSE;
    }

    // Garantir valores default
    return {
      intent: parsed.intent,
      confidence: parsed.confidence || 0,
      severity: parsed.severity || 'MEDIUM',
      stage_next: parsed.stage_next,
      action: parsed.action,
      missing_slots: parsed.missing_slots || [],
      reply: parsed.reply || 'Desculpe, não consegui processar sua mensagem.',
      checklist: parsed.checklist || [],
      handoff_reason: parsed.handoff_reason || ''
    };
  } catch (error) {
    console.error('[API] Erro ao parsear JSON:', error);
    return FALLBACK_RESPONSE;
  }
}

/**
 * Handler principal do endpoint
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as SupportRouterRequest;

    // Validação básica
    if (!body.chatId || !body.userMessage) {
      return res.status(400).json({ error: 'chatId e userMessage são obrigatórios' });
    }

    console.log('[API] Processando:', {
      chatId: body.chatId,
      message: body.userMessage,
      stage: body.currentStage,
      intent: body.currentIntent
    });

    // Construir mensagens para o LLM
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      // Incluir histórico recente para contexto
      ...body.history.slice(-3), // Últimas 3 mensagens
      // Mensagem atual do usuário com contexto da sessão
      {
        role: 'user',
        content: `
CONTEXTO DA SESSÃO:
- Stage atual: ${body.currentStage}
- Intent anterior: ${body.currentIntent || 'nenhum'}
- Confidence anterior: ${body.confidence}
- Severity: ${body.severity}
- Slots coletados: ${JSON.stringify(body.currentSlots)}

MENSAGEM DO USUÁRIO:
${body.userMessage}

Analise e retorne JSON conforme instruções.
        `.trim()
      }
    ];

    // Chamar OpenAI
    const llmResponse = await callOpenAI(messages);
    console.log('[API] Resposta do LLM:', llmResponse);

    // Validar e parsear resposta
    const validatedResponse = parseAndValidateResponse(llmResponse);

    // Retornar JSON
    return res.status(200).json(validatedResponse);
  } catch (error) {
    console.error('[API] Erro no handler:', error);
    
    // Em caso de erro, retornar fallback
    return res.status(200).json(FALLBACK_RESPONSE);
  }
}
