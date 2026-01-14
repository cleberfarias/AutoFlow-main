**MCP Tool Registry**

**Propósito:** Documento de referência para a API do Tool Registry implementado em [server/tools/registry.js](server/tools/registry.js). Explica contrato de registro, chamada, configurações, códigos de erro e boas práticas para escrever tools compatíveis com o runtime AutoFlow.

**API principal**

- **registerTool(name, handler, config?)**
  - `name`: string — identificador único da tool (ex: `whatsapp.gupshup.sendMessage`).
  - `handler`: async function `(args, ctx) => any` — função que realiza a ação. Deve aceitar `(args, ctx)`. O `ctx` pode conter `tenantId`, `chatId`, `signal` (AbortSignal) e outros metadados.
  - `config`: objeto opcional (ver `Config padrão` abaixo).

- **callTool(name, args?, ctx?) -> { success, result, error, meta }**
  - `success`: boolean — true quando handler retornou sem erro.
  - `result`: valor retornado pelo handler (quando `success===true`).
  - `error`: string ou mensagem quando `success===false` (ex: `timeout`, `circuit_open`, `rate_limited`, `tool_not_found`).
  - `meta`: informações operacionais: `{ attempts, breakerState, rateLimited }`.

**Contrato do handler**

O handler recebe 2 parâmetros: `args` (objeto arbitrário) e `ctx` (contexto). Exemplos de campos em `ctx`:

- `tenantId` — id do locatário/cliente (usado para rate-limiting e isolamento de breaker)
- `chatId` — id do chat de origem
- `signal` — `AbortSignal` (quando o runtime consegue propagá-lo para permitir cancelamento)

O handler pode lançar erros ou retornar objetos; erros aceitos para retry são considerados "transientes" quando:

- possuem `err.name==='AbortError'` (timeout) ou
- possuem `err.status` igual a 429 ou 5xx.

**Config padrão (DEFAULT_CONFIG)**

```
{
  timeoutMs: 4000,           // tempo máximo (ms) para execução do handler
  actionTimeoutMs: 8000,     // timeout para ações maiores (não usado em todos os handlers)
  maxRetries: 2,             // retries além da tentativa inicial (total = 1 + maxRetries)
  backoffMs: 200,            // base do backoff exponencial
  backoffMultiplier: 2,      // multiplicador do backoff
  breaker: {                 // circuit breaker (por tool+tenant)
    enabled: true,
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    halfOpenMaxCalls: 2
  },
  rateLimit: { enabled: true, perTenantPerMinute: 120 }
}
```

**Códigos de erro retornados (exemplos)**

- `tool_not_found` — tool não registrada
- `timeout` — timeout interno (handler levou mais que `timeoutMs`)
- `circuit_open` — circuit breaker está aberto para tool+tenant
- `rate_limited` — limite por tenant excedido
- `http_error` — erro HTTP retornado por tool que faz fetch (res.status disponível em err.status)
- `invalid_url`, `response_too_large` — erros do `http.request`

**Observabilidade**

O registry emite logs por chamada usando `server/observability/toolLog.js`. Cada evento tem o formato JSON com campos:

- `ts`, `tenantId`, `toolName`, `latencyMs`, `attempts`, `outcome` (success/failure/rate_limited/circuit_open), `breakerState`, `rateLimited`, `errorCode`.

**Helpers para testes**

- `_test_resetAll()` — limpa registro de tools, breakers e rate limits para permitir testes isolados.
- Para simular canais sem dependências externas, use `SKIP_WHATSAPP=1` no ambiente de teste.

**Tools registradas por padrão (exemplos presentes no código)**

1. `calendar.findAvailability(args)` — faz POST para `${TOOLS_BASE_URL}/api/poc/find-availability`.
2. `calendar.createAppointment(args)` — faz POST para `${TOOLS_BASE_URL}/api/poc/create-appointment`.
3. `http.request({ method, url, headers, body, timeoutMs })` — ferramenta genérica HTTP com proteção básica (allowlist http/https, 1MB máximo de resposta).
4. `whatsapp.gupshup.sendMessage({ to, text }, ctx)` — usa `server/tools/clients/gupshupClient.js` que respeita `SKIP_WHATSAPP` e encaminha para `TOOLS_BASE_URL`/poc em ambiente de teste.
5. `whatsapp.web.sendMessage({ to, text }, ctx)` — stub que quando `SKIP_WHATSAPP=1` retorna mock; caso contrário encaminha para `WHATSAPP_WEB_FORWARD_URL`.

**Exemplos de uso**

Registrar uma tool simples:

```js
import { registerTool } from './server/tools/registry.js';

registerTool('mytool.echo', async (args, ctx) => {
  return { echoed: args };
}, { timeoutMs: 1000, maxRetries: 0 });
```

Chamar uma tool (runtime via `actionRunner`):

```js
import { callTool } from './server/tools/registry.js';

const { success, result, error, meta } = await callTool('whatsapp.gupshup.sendMessage', { to: '5511999999', text: 'oi' }, { tenantId: 'acme' });
if (!success) { /* tratar fallback/handoff */ }
```

**Boas práticas para handlers**

- Respeitar `ctx.signal` (AbortSignal) sempre que fizer operações bloqueantes/`fetch`.
- Validar inputs e lançar erros com `err.status` quando apropriado para que o registry decida retry.
- Evitar efeitos colaterais irreversíveis sem idempotência quando possível.

**Notas de segurança e limites**

- `http.request` aplica validações básicas: permite somente `http://` e `https://` e limita o tamanho da resposta. Para produção, use allowlist mais rigorosa.
- Circuit breaker e rate limit são mantidos em memória no MVP; para clusters migrar para Redis/Central store.

**Testes**

- Veja `tests/registry.test.ts` para exemplos de testes de timeout, retry, circuit-breaker e rate-limit.
- Use `_test_resetAll()` no `beforeEach` para garantir isolamento.

**Arquivo fonte**

- Implementação: [server/tools/registry.js](server/tools/registry.js)
- Observabilidade: [server/observability/toolLog.js](server/observability/toolLog.js)
- Clients: [server/tools/clients/gupshupClient.js](server/tools/clients/gupshupClient.js)
