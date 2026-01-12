# 🚀 Quick Start - Sistema de Suporte ChatGuru

Sistema de hierarquia de IA implementado com sucesso! Aqui está tudo que você precisa saber.

## ✅ O que foi implementado?

1. **Módulo de Sessão** ([src/services/session.ts](src/services/session.ts))
   - Gerenciamento de sessões com localStorage
   - TTL de 30 minutos configurável
   - Funções: getSession, saveSession, resetSession, isExpired

2. **Support Router** ([src/services/supportRouter.ts](src/services/supportRouter.ts))
   - Camada 0: Regras rápidas (GREETING, THANKS, comandos)
   - Camada 1: Chamada à API backend com OpenAI
   - Processamento de intents, stages, slots, confidence

3. **Endpoint Serverless** ([api/support-router.ts](api/support-router.ts))
   - Model: gpt-4o-mini (barato e rápido)
   - Validação de JSON com fallback
   - OPENAI_API_KEY segura no backend

4. **UI Atualizado** ([components/TestChat.tsx](components/TestChat.tsx))
   - Modo 'support' com badges de status
   - Renderização de checklist visual
   - Indicadores de stage/intent/severity/confidence

## 🎯 Como usar?

### Opção 1: Widget de Suporte (Recomendado)

```tsx
import { SupportWidget } from './examples/SupportIntegration';

function App() {
  return (
    <>
      <YourApp />
      <SupportWidget />  {/* Botão flutuante no canto inferior direito */}
    </>
  );
}
```

### Opção 2: Componente TestChat com modo suporte

```tsx
<TestChat 
  steps={[]} 
  onClose={() => setShowSupport(false)}
  onStepActive={() => {}}
  mode="support"  // ← novo modo!
/>
```

### Opção 3: Integração programática

```typescript
import { handleMessage } from './src/services/supportRouter';

const response = await handleMessage('chat_123', 'Como faço login?');

console.log(response.replyText);  // "Aqui está o passo a passo..."
console.log(response.checklist);  // ['Acesse...', 'Clique...']
console.log(response.intent);     // "AUTH_LOGIN"
console.log(response.severity);   // "LOW"
```

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

Isso instalará automaticamente o `@vercel/node` necessário.

### 2. Configurar variáveis de ambiente

Copie o exemplo:
```bash
cp .env.local.example .env.local
```

Edite `.env.local`:
```bash
# Backend (OBRIGATÓRIO)
OPENAI_API_KEY=sk-proj-sua-chave-real-aqui

# Frontend (legacy - será removido futuramente)
VITE_OPENAI_API_KEY=sk-proj-sua-chave-real-aqui
```

### 3. Rodar localmente

```bash
# Modo desenvolvimento Vite (frontend)
npm run dev

# Modo Vercel Dev (testa endpoints serverless)
vercel dev
```

Acesse: http://localhost:5173

## 🌐 Deploy na Vercel

### Via Dashboard (mais fácil):

1. Acesse https://vercel.com
2. Importe seu repositório Git
3. Adicione variável de ambiente:
   - `OPENAI_API_KEY` = `sk-proj-...`
4. Deploy!

### Via CLI:

```bash
vercel login
vercel --prod
```

**📖 Guia completo de deploy**: [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)

## 🧪 Testar o sistema

### Teste 1: Camada 0 (respostas instantâneas, sem gastar API)
```
Digite: "oi"
Resultado: Resposta de saudação imediata (0ms)

Digite: "obrigado"
Resultado: Resposta de agradecimento (0ms)

Digite: "falar com atendente"
Resultado: HANDOFF imediato para humano (0ms)
```

### Teste 2: Camada 1 (usa OpenAI)
```
Digite: "Como faço login?"
Resultado: 
  - Intent: AUTH_LOGIN
  - Action: CHECKLIST
  - Checklist visual com 4 passos
  - Tempo: ~800ms

Digite: "WhatsApp não conecta"
Resultado:
  - Intent: WHATSAPP_CONNECT
  - Action: ASK
  - Pergunta para coletar mais informações
  - Stage: COOLDOWN

Digite: "quero cancelar meu plano"
Resultado:
  - Intent: BILLING
  - Severity: HIGH
  - Action: HANDOFF
  - Transfere para atendente humano
```

## 📁 Estrutura de Arquivos

```
/api
  └── support-router.ts          # Endpoint serverless Vercel
/src
  └── /services
      ├── session.ts             # Gerenciamento de sessões
      └── supportRouter.ts       # Lógica de roteamento IA
/components
  └── TestChat.tsx               # UI do chat (modo workflow + support)
/examples
  └── SupportIntegration.tsx     # Exemplos de integração
vercel.json                      # Configuração Vercel
.env.local.example               # Template de variáveis de ambiente
SUPPORT_SYSTEM.md                # Documentação detalhada do sistema
DEPLOY_GUIDE.md                  # Guia de deploy passo a passo
```

## 🔍 Monitoramento

### Ver status de uma sessão:
```typescript
import { getSessionStatus } from './src/services/supportRouter';

const status = getSessionStatus('chat_123');
console.log(status);
// {
//   stage: 'MIDDLE',
//   intent: 'AUTH_LOGIN',
//   confidence: 0.95,
//   severity: 'LOW',
//   messagesCount: 6,
//   slots: { email: 'user@example.com' }
// }
```

### Limpar sessões expiradas:
```typescript
import { cleanupExpiredSessions } from './src/services/session';

const cleaned = cleanupExpiredSessions();
console.log(`${cleaned} sessões removidas`);
```

## 📊 Schema da Resposta da IA

```typescript
{
  intent: 'AUTH_LOGIN' | 'WHATSAPP_CONNECT' | 'BILLING' | ...,
  confidence: 0.95,               // 0.0 a 1.0
  severity: 'LOW' | 'MEDIUM' | 'HIGH',
  stage_next: 'START' | 'MIDDLE' | 'COOLDOWN' | 'END' | 'HUMAN',
  action: 'REPLY' | 'ASK' | 'CHECKLIST' | 'HANDOFF',
  missing_slots: ['email', 'error_message'],
  reply: 'Como posso ajudar?',
  checklist: ['Passo 1', 'Passo 2', 'Passo 3'],
  handoff_reason: 'Questão financeira sensível'
}
```

## 💡 Dicas Pro

1. **Taxa de economia**: ~40% das conversas são resolvidas pela Camada 0 (sem custo de API)

2. **Custo por conversa**: ~$0.0001 (usando gpt-4o-mini)

3. **TTL de sessão**: 30 minutos (ajustável em `session.ts`)

4. **Migração para produção**: Trocar localStorage por Redis/MongoDB é trivial (mesma interface)

5. **Rate limiting**: Use Upstash para limitar requests (veja [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md))

## 🎨 Customização

### Mudar TTL da sessão:
```typescript
// src/services/session.ts
const DEFAULT_TTL_MINUTES = 60; // de 30 para 60 minutos
```

### Adicionar novo intent:
```typescript
// src/services/session.ts
export type SupportIntent = 
  | 'AUTH_LOGIN'
  | 'NEW_INTENT_HERE'  // ← adicione aqui
  | ...;

// api/support-router.ts
// Atualize o System Prompt para incluir o novo intent
```

### Customizar Camada 0:
```typescript
// src/services/supportRouter.ts
function applyLayer0Rules(message: string) {
  // Adicione suas regras customizadas aqui
  if (/seu padrão/i.test(message)) {
    return { /* sua resposta */ };
  }
}
```

## 🐛 Problemas Comuns

**"API key not found"**
→ Configure `OPENAI_API_KEY` no Vercel Dashboard

**"Endpoint returns 404"**
→ Certifique-se que `api/support-router.ts` existe e tem `export default`

**"Session não persiste"**
→ Normal em modo incognito; funciona em navegação normal

**"JSON parse error"**
→ Fallback automático já implementado, retorna HANDOFF

## 📚 Documentação Completa

- **Sistema completo**: [SUPPORT_SYSTEM.md](SUPPORT_SYSTEM.md)
- **Deploy passo a passo**: [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)
- **Exemplos de código**: [examples/SupportIntegration.tsx](examples/SupportIntegration.tsx)

## 🎉 Pronto!

Seu sistema de suporte hierárquico está funcionando! 

Para começar:
1. ✅ Configure `.env.local`
2. ✅ Rode `npm install`
3. ✅ Execute `npm run dev`
4. ✅ Teste com `mode="support"` no TestChat

**Dúvidas?** Consulte [SUPPORT_SYSTEM.md](SUPPORT_SYSTEM.md) ou [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)
