# Deploy do Sistema de Suporte ChatGuru na Vercel

## 🚀 Passo a Passo para Deploy

### 1. Preparação

Certifique-se de que você tem:
- ✅ Conta na Vercel
- ✅ Repositório Git (GitHub, GitLab, ou Bitbucket)
- ✅ Chave da OpenAI (https://platform.openai.com/api-keys)

### 2. Instalar Dependências

```bash
npm install
# ou
pnpm install
```

Se ainda não tiver o pacote Vercel:
```bash
npm install --save-dev @vercel/node
```

### 3. Configurar Variáveis de Ambiente Localmente

Crie `.env.local` (não commitar!):
```bash
# Backend (para testes locais com Vercel Dev)
OPENAI_API_KEY=sk-proj-sua-chave-real-aqui

# Frontend (legacy - será removido)
VITE_OPENAI_API_KEY=sk-proj-sua-chave-real-aqui
```

### 4. Testar Localmente com Vercel Dev

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Rodar em modo dev (simula ambiente Vercel)
vercel dev
```

Acesse: http://localhost:3000

Teste o endpoint: http://localhost:3000/api/support-router

### 5. Deploy na Vercel

#### Opção A: Via CLI (Terminal)

```bash
# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

#### Opção B: Via Dashboard (Recomendado)

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New" → "Project"
3. Importe seu repositório Git
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **IMPORTANTE**: Adicione variáveis de ambiente:
   - Vá em "Environment Variables"
   - Adicione:
     - Name: `OPENAI_API_KEY`
     - Value: `sk-proj-...` (sua chave real)
     - Environment: Production, Preview, Development

6. Clique em "Deploy"

### 6. Verificar Deploy

Após deploy bem-sucedido:

```bash
# Teste o endpoint em produção
curl -X POST https://seu-projeto.vercel.app/api/support-router \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test_123",
    "userMessage": "Como faço login?",
    "currentStage": "START",
    "currentIntent": null,
    "currentSlots": {},
    "history": [],
    "confidence": 0,
    "severity": "LOW"
  }'
```

Resposta esperada:
```json
{
  "intent": "AUTH_LOGIN",
  "confidence": 0.95,
  "severity": "LOW",
  "stage_next": "MIDDLE",
  "action": "CHECKLIST",
  "missing_slots": [],
  "reply": "Aqui está o passo a passo...",
  "checklist": ["Acesse chatguru.com.br", "..."],
  "handoff_reason": ""
}
```

## 🔧 Configurações Avançadas

### Ajustar Timeout (se necessário)

No `vercel.json`:
```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**Nota**: Free tier da Vercel tem limite de 10s. Pro tier permite até 60s.

### Adicionar CORS Personalizado

No `api/support-router.ts`, você pode ajustar:
```typescript
res.setHeader('Access-Control-Allow-Origin', 'https://seu-dominio.com');
```

### Configurar Custom Domain

1. No dashboard da Vercel → seu projeto
2. "Settings" → "Domains"
3. Adicione seu domínio personalizado
4. Configure DNS conforme instruções

## 🐛 Troubleshooting

### Erro 401 - Unauthorized
**Problema**: OPENAI_API_KEY inválida ou não configurada

**Solução**:
1. Verifique a chave em https://platform.openai.com
2. Confirme que está configurada na Vercel:
   - Dashboard → Projeto → Settings → Environment Variables
3. Redeploy: `vercel --prod`

### Erro 500 - Internal Server Error
**Problema**: Erro no código do endpoint

**Solução**:
1. Verifique logs na Vercel:
   - Dashboard → Projeto → Deployments → [Latest] → View Function Logs
2. Teste localmente: `vercel dev`
3. Console do navegador: `F12` → Console

### Endpoint retorna 404
**Problema**: Rota não encontrada

**Solução**:
1. Verifique estrutura de pastas:
   ```
   /api
     /support-router.ts  ← deve estar aqui
   ```
2. Arquivo deve exportar `default async function handler(req, res)`
3. Redeploy

### Timeout - Request took too long
**Problema**: OpenAI demorou mais de 10s

**Solução**:
1. Upgrade para Vercel Pro (limite de 30-60s)
2. Ou otimize prompt para respostas mais rápidas
3. Ou implemente retry logic

### CORS Error
**Problema**: Frontend não consegue chamar API

**Solução**:
1. Confirme que `Access-Control-Allow-Origin` está configurado
2. Para dev local, use proxy no `vite.config.ts`:
   ```typescript
   export default defineConfig({
     server: {
       proxy: {
         '/api': 'http://localhost:3000'
       }
     }
   });
   ```

## 📊 Monitoramento

### Ver Logs em Tempo Real

```bash
vercel logs seu-projeto.vercel.app --follow
```

### Métricas de Uso

No Dashboard da Vercel:
- **Functions**: Número de invocações, duração
- **Bandwidth**: Dados transferidos
- **Edge Network**: Latência por região

### Alertas (Pro/Enterprise)

Configure alertas para:
- Taxa de erro > 5%
- Duração média > 3s
- Rate limit atingido

## 💰 Custos

### Vercel
- **Hobby (Free)**: 100GB bandwidth, 100 horas de execução
- **Pro ($20/mês)**: Ilimitado, timeouts maiores, analytics

### OpenAI (gpt-4o-mini)
- **Input**: $0.15 por 1M tokens
- **Output**: $0.60 por 1M tokens
- ~$0.0001 por conversa (estimativa)
- 10.000 conversas/mês = ~$1

### Estimativa Total
Para 1.000 usuários ativos/mês:
- Vercel: $0 (Free tier) ou $20 (Pro)
- OpenAI: ~$5-10
- **Total**: $5-30/mês

## 🔐 Segurança

### Checklist de Segurança

- ✅ OPENAI_API_KEY nunca exposta no frontend
- ✅ CORS configurado corretamente
- ✅ Rate limiting (usar Vercel Edge Config ou Upstash)
- ✅ Validação de entrada no backend
- ✅ HTTPS obrigatório (automático na Vercel)
- ⚠️ TODO: Implementar autenticação de usuários
- ⚠️ TODO: Limitar requests por IP

### Adicionar Rate Limiting

Instale Upstash:
```bash
npm install @upstash/ratelimit @upstash/redis
```

No `api/support-router.ts`:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests por 10s
});

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // ... resto do código
}
```

## 🎯 Otimizações

### Cache de Respostas Comuns

Para perguntas frequentes, implemente cache:
```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hora
});

const cacheKey = `${userMessage.toLowerCase().trim()}`;
const cached = cache.get(cacheKey);
if (cached) return res.json(cached);

// ... chamar OpenAI
cache.set(cacheKey, response);
```

### Streaming de Respostas

Para UX mais fluida, use Server-Sent Events:
```typescript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

// Stream da OpenAI
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
  stream: true
});

for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
}
res.end();
```

## 📞 Suporte

Se encontrar problemas:
1. Consulte logs: `vercel logs`
2. Documentação Vercel: https://vercel.com/docs
3. Documentação OpenAI: https://platform.openai.com/docs

---

**Última atualização**: Janeiro 2026
**Versão do sistema**: 1.0.0
