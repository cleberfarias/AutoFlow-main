# AutoFlow MCP Server

## 🎯 O que é MCP?

**Model Context Protocol (MCP)** é um protocolo aberto da Anthropic que permite que LLMs (como Claude) se conectem a ferramentas externas, databases, APIs, etc.

O AutoFlow MCP Server expõe as ferramentas do AutoFlow para qualquer cliente MCP.

## 🚀 Como Usar

### 1. Rodar o Servidor MCP

```bash
# Opção 1: Via npm script
npm run mcp:server

# Opção 2: Diretamente
node server/mcp/server.js
```

O servidor usa **stdio** (stdin/stdout) para comunicação JSON-RPC 2.0.

### 2. Testar Manualmente

```bash
# Enviar mensagem de initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node server/mcp/server.js

# Listar ferramentas disponíveis
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node server/mcp/server.js
```

### 3. Integrar com Claude Desktop

1. Localize o arquivo de configuração do Claude Desktop:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Adicione o AutoFlow MCP Server:

```json
{
  "mcpServers": {
    "autoflow": {
      "command": "node",
      "args": [
        "/absolute/path/to/AutoFlow-main/server/mcp/server.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

3. Reinicie o Claude Desktop

4. No Claude, você verá um ícone 🔌 indicando que o servidor está conectado

5. Claude agora pode usar as ferramentas do AutoFlow!

## 🛠️ Ferramentas Disponíveis

O servidor expõe automaticamente todas as tools do `server/tools/registry.js`:

### calendar.findAvailability
Busca próxima disponibilidade no calendário

**Parâmetros**:
- `serviceId` (string, opcional): ID do serviço
- `professionalId` (string, opcional): ID do profissional
- `durationMinutes` (number, opcional): Duração em minutos
- `fromISO` (string, opcional): Data/hora inicial (ISO 8601)

**Exemplo de uso no Claude**:
```
"Encontre a próxima vaga disponível para uma limpeza de pele"
```

### calendar.createAppointment
Cria um novo agendamento

**Parâmetros**:
- `clientId` (string, obrigatório): ID do cliente
- `professionalId` (string, opcional): ID do profissional
- `serviceId` (string, obrigatório): ID do serviço
- `start` (string, obrigatório): Data/hora de início (ISO 8601)
- `end` (string, obrigatório): Data/hora de fim (ISO 8601)

**Exemplo de uso no Claude**:
```
"Agende uma consulta para o cliente 123 amanhã às 14h"
```

## 📋 Prompts Disponíveis

O servidor também expõe prompts pré-configurados:

### create_workflow
Cria um workflow de automação baseado em descrição

**Argumentos**:
- `description` (obrigatório): Descrição do workflow

**Exemplo**:
```
"Use o prompt create_workflow para criar um fluxo de atendimento ao cliente"
```

### schedule_appointment
Ajuda a agendar um compromisso

**Argumentos**:
- `service` (opcional): Tipo de serviço
- `datetime` (opcional): Data/hora desejada

**Exemplo**:
```
"Use o prompt schedule_appointment para agendar uma consulta"
```

## 🔧 Métodos MCP Suportados

### Core
- ✅ `initialize` - Inicializa conexão MCP
- ✅ `ping` - Health check

### Tools
- ✅ `tools/list` - Lista ferramentas disponíveis
- ✅ `tools/call` - Executa uma ferramenta

### Resources
- ✅ `resources/list` - Lista recursos (vazio por enquanto)
- ✅ `resources/read` - Lê um recurso

### Prompts
- ✅ `prompts/list` - Lista prompts disponíveis
- ✅ `prompts/get` - Obtém um prompt específico

## 🎨 Arquitetura

```
┌─────────────────┐
│  Claude Desktop │
│   ou outro LLM  │
└────────┬────────┘
         │ JSON-RPC over stdio
         │
┌────────▼────────────┐
│  MCP Server         │
│  (server/mcp)       │
└────────┬────────────┘
         │
┌────────▼────────────┐
│  Tool Registry      │
│  (server/tools)     │
└────────┬────────────┘
         │
┌────────▼────────────┐
│  AutoFlow Backend   │
│  (POC endpoints)    │
└─────────────────────┘
```

## 📡 Protocolo JSON-RPC 2.0

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "calendar.findAvailability",
    "arguments": {
      "serviceId": "s1"
    }
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"found\":true,\"suggestedStart\":\"2025-01-15T10:00:00Z\"}"
      }
    ],
    "isError": false
  }
}
```

### Error
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Tool execution failed"
  }
}
```

## 🧪 Testes

### Teste de Conexão
```bash
node server/mcp/server.js < test-messages.json
```

### Teste Interativo
```bash
node server/mcp/server.js
# Digite mensagens JSON-RPC linha por linha
```

### Teste com Cliente MCP
```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector node server/mcp/server.js
```

## 🔐 Segurança

- ✅ Comunicação via stdio (local only)
- ✅ Validação de JSON-RPC 2.0
- ✅ Timeout de 5s para execução de tools
- ✅ Error handling robusto
- ✅ Logs apenas em stderr (não polui stdout)

## 📚 Recursos

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/model-context-protocol)

## 🎯 Próximos Passos

1. **Adicionar mais tools**: Extenda `server/tools/registry.js`
2. **Resources**: Expor workflows, templates, etc como resources
3. **Prompts**: Adicionar mais prompts especializados
4. **Sampling**: Implementar client sampling para tools que precisam de LLM
5. **HTTP Transport**: Suporte a MCP over HTTP (além de stdio)

## 💡 Exemplos de Uso

### No Claude Desktop

**Usuário**: "Quais horários estão disponíveis para consulta amanhã?"

**Claude**: *Usa calendar.findAvailability* 
"Encontrei disponibilidade às 10h, 14h e 16h. Qual prefere?"

**Usuário**: "Agende para as 14h"

**Claude**: *Usa calendar.createAppointment*
"Agendamento confirmado para amanhã às 14h! ✅"

### Em IDEs com Suporte MCP

```typescript
// O desenvolvedor pode perguntar ao LLM no IDE:
// "Gere um workflow para processar pedidos de e-commerce"

// O LLM usa o AutoFlow MCP Server para gerar o workflow
// e retorna o JSON estruturado pronto para uso
```

---

**Nota**: Este servidor MCP segue a especificação oficial e é compatível com qualquer cliente MCP (Claude Desktop, Cline, Cursor, etc).
