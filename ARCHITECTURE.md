# 🏗️ Arquitetura Técnica - Sistema de Suporte ChatGuru

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vite)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   TestChat   │  │ SupportWidget│  │ Programmatic API     │  │
│  │  (UI Mode)   │  │  (Floating)  │  │ (Direct Integration) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────┘  │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│                            ▼                                     │
│              ┌───────────────────────────┐                       │
│              │  supportRouter.ts         │                       │
│              │  (Service Layer)          │                       │
│              └─────────────┬─────────────┘                       │
│                            │                                     │
│         ┌──────────────────┴───────────────────┐                │
│         │                                      │                │
│         ▼                                      ▼                │
│  ┌─────────────┐                      ┌───────────────┐        │
│  │  CAMADA 0   │                      │   CAMADA 1    │        │
│  │  (Regras    │                      │   (LLM API)   │        │
│  │   Rápidas)  │                      │               │        │
│  └──────┬──────┘                      └───────┬───────┘        │
│         │                                     │                │
│         │ Patterns:                           │                │
│         │ • GREETING                          │                │
│         │ • THANKS                            │                │
│         │ • OK/EMOJI                          │                │
│         │ • "atendente"                       │                │
│         │                                     │                │
│         │ ✓ ~0ms                              │ POST           │
│         │ ✓ $0.00                             │                │
│         │ ✓ 40% tráfego                       │                │
│         │                                     ▼                │
└─────────┼─────────────────────────────────────┼────────────────┘
          │                                     │
          │                                     │
          │                        ┌────────────▼─────────────┐
          │                        │  BACKEND (Vercel Edge)   │
          │                        │  /api/support-router.ts  │
          │                        └────────────┬─────────────┘
          │                                     │
          │                                     │ OPENAI_API_KEY
          │                                     │ (env var)
          │                                     ▼
          │                        ┌─────────────────────────┐
          │                        │    OpenAI API           │
          │                        │    Model: gpt-4o-mini   │
          │                        │    Response: JSON       │
          │                        └────────────┬────────────┘
          │                                     │
          │                                     │ Structured JSON:
          │                                     │ • intent
          │                                     │ • confidence
          │                                     │ • severity
          │                                     │ • stage_next
          │                                     │ • action
          │                                     │ • reply
          │                                     │ • checklist
          │                                     │ • missing_slots
          │                                     │
          └─────────────────────────────────────┘
                                               │
                ┌──────────────────────────────┘
                │
                ▼
     ┌──────────────────────────┐
     │    SESSION STORAGE       │
     │    (localStorage)        │
     │                          │
     │  • session.ts            │
     │  • TTL: 30min            │
     │  • States: START/MIDDLE/ │
     │    COOLDOWN/END/HUMAN    │
     │  • Slots, History        │
     └──────────────────────────┘
```

## Fluxo de Dados Detalhado

### 1. User Input → Support Router

```typescript
// User digita mensagem
const userMessage = "Como faço login?";

// Frontend chama supportRouter
const response = await handleMessage(chatId, userMessage);
```

### 2. Session Management

```typescript
// 1. Carregar ou criar sessão
let session = getSession(chatId);

// 2. Adicionar mensagem ao histórico
session = addMessageToHistory(session, 'user', userMessage);

// 3. Verificar TTL
if (isExpired(session)) {
  session = createNewSession(chatId);
}
```

### 3. Layer 0 Processing (Camada 0)

```typescript
function applyLayer0Rules(message: string): SupportUIResponse | null {
  const lowerMsg = message.toLowerCase().trim();
  
  // Pattern matching
  if (/^(oi|olá|hello)$/i.test(lowerMsg)) {
    return {
      replyText: 'Olá! Como posso ajudar?',
      action: 'REPLY',
      stageNext: 'START',
      intent: 'GREETING',
      // ...
    };
  }
  
  // Se nenhum pattern, retorna null → vai para Camada 1
  return null;
}
```

### 4. Layer 1 API Call (Camada 1)

```typescript
// Frontend → Backend
const response = await fetch('/api/support-router', {
  method: 'POST',
  body: JSON.stringify({
    chatId,
    userMessage,
    currentStage: session.stage,
    currentIntent: session.intent,
    currentSlots: session.slots,
    history: getRecentHistory(session, 5)
  })
});

// Backend → OpenAI
const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userMessage }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  })
});
```

### 5. Response Processing

```typescript
// Parse e validar JSON
const data = parseAndValidateResponse(llmResponse);

// Atualizar sessão
session.stage = data.stage_next;
session.intent = data.intent;
session.confidence = data.confidence;
session.severity = data.severity;

// Processar missing_slots
if (data.missing_slots.length > 0) {
  session.stage = 'COOLDOWN';
  data.missing_slots.forEach(slot => {
    session.slots[slot] = null;
  });
}

// Adicionar resposta ao histórico
session = addMessageToHistory(session, 'assistant', data.reply);

// Salvar sessão
saveSession(chatId, session);
```

### 6. UI Rendering

```tsx
{/* Mensagem principal */}
<div className="message">
  {response.replyText}
</div>

{/* Checklist (se existir) */}
{response.checklist.length > 0 && (
  <ol>
    {response.checklist.map((step, i) => (
      <li key={i}>{step}</li>
    ))}
  </ol>
)}

{/* Badges de status */}
<div className="badges">
  <Badge>{response.stage}</Badge>
  <Badge severity={response.severity}>{response.severity}</Badge>
  <Badge>Confidence: {response.confidence * 100}%</Badge>
</div>
```

## Estados e Transições

### Máquina de Estados (FSM)

```
START
  │
  ├─ [Camada 0: GREETING] → END
  │
  ├─ [Camada 1: REPLY] → END
  │
  ├─ [Camada 1: ASK] → MIDDLE
  │      │
  │      └─ [Resposta do usuário] → COOLDOWN
  │              │
  │              └─ [Slots preenchidos] → END
  │
  ├─ [Camada 1: CHECKLIST] → END
  │
  └─ [Camada 1: HANDOFF] → HUMAN
         │
         └─ [Fim da sessão]
```

### Severidade e Ações

```
LOW severity
  └─ REPLY | ASK | CHECKLIST

MEDIUM severity
  └─ ASK | CHECKLIST | (HANDOFF se confidence < 0.5)

HIGH severity
  └─ HANDOFF (prioridade)
```

## Estrutura de Dados

### SessionState

```typescript
interface SessionState {
  chatId: string;              // ID único da conversa
  stage: SessionStage;         // START | MIDDLE | COOLDOWN | END | HUMAN
  intent: SupportIntent | null; // AUTH_LOGIN | WHATSAPP_CONNECT | ...
  confidence: number;          // 0.0 a 1.0
  severity: Severity;          // LOW | MEDIUM | HIGH
  slots: Record<string, any>;  // { email: "...", error: "..." }
  history: Message[];          // Histórico de mensagens
  createdAt: number;           // Timestamp de criação
  updatedAt: number;           // Timestamp da última atualização
  ttlMinutes: number;          // Tempo de vida (default: 30)
}
```

### SupportRouterResponse (API)

```typescript
interface SupportRouterResponse {
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
```

### SupportUIResponse (Frontend)

```typescript
interface SupportUIResponse {
  replyText: string;
  action: 'REPLY' | 'ASK' | 'CHECKLIST' | 'HANDOFF';
  checklist: string[];
  stageNext: SessionStage;
  intent: SupportIntent;
  severity: Severity;
  confidence: number;
  handoffReason?: string;
}
```

## Performance e Otimização

### Latências Típicas

| Componente           | Latência  | Custo     |
|---------------------|-----------|-----------|
| Camada 0 (Regras)   | ~0ms      | $0.00     |
| Camada 1 (API Call) | ~800ms    | ~$0.0001  |
| Session Get/Save    | ~1ms      | $0.00     |
| UI Render           | ~50ms     | $0.00     |
| **Total Médio**     | **~850ms**| **~$0.0001** |

### Taxa de Hit da Camada 0

- **Saudações**: ~25% do tráfego
- **Agradecimentos**: ~10% do tráfego
- **Confirmações**: ~5% do tráfego
- **Total Camada 0**: **~40% economia de API calls**

### Escalabilidade

#### Sessões Simultâneas

| Armazenamento | Capacidade           | Latência  |
|--------------|----------------------|-----------|
| localStorage | 5-10MB (~500 sessões)| 1ms       |
| Redis        | Ilimitado            | 5-10ms    |
| MongoDB      | Ilimitado            | 20-50ms   |

#### API Rate Limits

- **Vercel Free**: 100 horas/mês de execução
- **OpenAI**: 3.500 RPM (requests per minute)
- **Recomendado**: Rate limiting com Upstash (10 req/10s por IP)

## Segurança

### Camadas de Segurança

```
1. HTTPS (Automático na Vercel)
   ↓
2. CORS Headers (configurado em api/support-router.ts)
   ↓
3. Input Validation (server-side)
   ↓
4. Rate Limiting (TODO: Upstash)
   ↓
5. API Key Protection (process.env, nunca exposta)
   ↓
6. Session Isolation (chatId único por usuário)
```

### Checklist de Segurança

- ✅ OPENAI_API_KEY apenas no backend
- ✅ CORS configurado
- ✅ Input validation básica
- ✅ HTTPS obrigatório
- ⚠️ Rate limiting (planejado)
- ⚠️ User authentication (futuro)
- ⚠️ Logs de auditoria (futuro)

## Monitoramento e Observabilidade

### Logs Estruturados

```typescript
// Session logs
console.log('[Session] Sessão chat_123 salva - Stage: MIDDLE');

// Router logs
console.log('[SupportRouter] Resolvido pela Camada 0');
console.log('[SupportRouter] Chamando API...');

// API logs
console.log('[API] Processando:', { chatId, message, stage });
console.log('[API] Resposta do LLM:', jsonResponse);
```

### Métricas Sugeridas

```typescript
// Implementar com Analytics
{
  // Uso
  total_sessions: number;
  active_sessions: number;
  avg_messages_per_session: number;
  
  // Performance
  avg_response_time_ms: number;
  layer0_hit_rate: number;
  api_error_rate: number;
  
  // Qualidade
  avg_confidence: number;
  handoff_rate: number;
  top_intents: Array<{ intent: string; count: number }>;
  
  // Custo
  total_api_calls: number;
  estimated_cost_usd: number;
}
```

## Troubleshooting Guide

### Problema: Sessão não persiste

**Causa**: localStorage limpo ou modo incognito
**Diagnóstico**:
```typescript
console.log('localStorage size:', localStorage.length);
listActiveSessions().forEach(s => console.log(s.chatId));
```
**Solução**: Normal em incognito; em produção funciona corretamente

### Problema: API retorna 401

**Causa**: OPENAI_API_KEY inválida
**Diagnóstico**:
```bash
# Ver logs da Vercel
vercel logs --follow

# Testar chave localmente
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```
**Solução**: Verificar e atualizar chave na Vercel

### Problema: Timeout na API

**Causa**: OpenAI demorou > 10s (limite Vercel Free)
**Diagnóstico**: Ver logs → "Function Timeout"
**Solução**: Upgrade para Vercel Pro ou otimizar prompt

### Problema: JSON parse error

**Causa**: LLM retornou texto não-JSON
**Diagnóstico**: Ver logs da API → `[API] Erro ao parsear JSON`
**Solução**: Já tem fallback automático (HANDOFF)

## Roadmap Técnico

### v1.1 (Curto Prazo)
- [ ] Migrar persistência para Redis/Upstash
- [ ] Implementar rate limiting
- [ ] Adicionar analytics dashboard
- [ ] Testes E2E com Playwright

### v1.2 (Médio Prazo)
- [ ] Streaming de respostas (SSE)
- [ ] Multi-idioma (i18n)
- [ ] Cache de respostas comuns (LRU)
- [ ] Integração com sistemas de tickets

### v2.0 (Longo Prazo)
- [ ] Fine-tuning do modelo
- [ ] Feedback loop para melhorar prompts
- [ ] A/B testing de prompts
- [ ] Modo offline com fallback

---

**Versão**: 1.0.0
**Data**: Janeiro 2026
**Autor**: Sistema desenvolvido seguindo as melhores práticas de arquitetura de software
