# WhatsApp MEOW - Guia Completo

> **MEOW** = Multi-Device Evolution Of WhatsApp

## 📱 Visão Geral

WhatsApp MEOW é a integração oficial do AutoFlow com WhatsApp usando a biblioteca `whatsapp-web.js`. Permite conectar seu número WhatsApp para enviar e receber mensagens automaticamente através de workflows.

## ⚡ Características

### ✅ Recursos Implementados

- **Autenticação via QR Code** - Conecte seu WhatsApp em segundos
- **Envio de Mensagens** - Texto, mídia (imagens, vídeos, áudios, documentos)
- **Recebimento de Mensagens** - Webhook em tempo real para mensagens recebidas
- **Gerenciamento de Grupos** - Criar, listar, adicionar/remover participantes
- **Status e Presença** - Controle de online/offline
- **Contatos** - Listagem e busca de contatos
- **Confirmação de Leitura** - Marcar conversas como lidas
- **Localização** - Enviar coordenadas GPS
- **Auto-Reconexão** - Mantém a conexão estável
- **Interface Gráfica** - Dashboard completo no AutoFlow
- **Multi-idioma** - Português, Inglês e Espanhol

## 🚀 Como Usar

### 1. Instalação

As dependências já estão incluídas no `package.json`:

```bash
npm install
```

Pacotes necessários:
- `whatsapp-web.js` - Cliente WhatsApp Web
- `qrcode-terminal` - Geração de QR Code no terminal

### 2. Iniciar o WhatsApp Manager

#### Via Interface Web (Recomendado)

1. Inicie o AutoFlow:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:5173`

3. No menu lateral, clique em **"WhatsApp"** (ícone de mensagem)

4. Clique em **"Conectar"**

5. Escaneie o QR Code que aparece com seu WhatsApp:
   - Abra o WhatsApp no celular
   - Vá em **Configurações** → **Dispositivos Vinculados**
   - Toque em **"Vincular dispositivo"**
   - Escaneie o QR Code

6. Aguarde a confirmação de conexão

#### Via Terminal (Desenvolvimento)

```bash
npm run whatsapp:start
```

O QR Code aparecerá no terminal.

### 3. Testar Envio de Mensagem

No dashboard do WhatsApp:

1. Insira um número no formato: `5511999999999` (sem +)
2. Digite a mensagem de teste
3. Clique em **"Enviar"**

### 4. Integrar com Workflows

```typescript
import { getWhatsAppInstance } from './services/whatsappMeow';

const whatsapp = getWhatsAppInstance();

// Enviar mensagem
await whatsapp.sendMessage('5511999999999', 'Olá! Esta é uma mensagem automática.');

// Enviar mídia
await whatsapp.sendMedia(
  '5511999999999',
  'https://example.com/image.jpg',
  { caption: 'Confira esta imagem!' }
);

// Ouvir mensagens recebidas
whatsapp.onMessage('my-handler', (msg) => {
  console.log(`Mensagem de ${msg.from}: ${msg.body}`);
  
  // Responder automaticamente
  if (msg.body.toLowerCase() === 'oi') {
    whatsapp.sendMessage(msg.from, 'Olá! Como posso ajudar?');
  }
});
```

## 🔧 Configuração Avançada

### Opções de Inicialização

```typescript
import WhatsAppMeow from './services/whatsappMeow';

const whatsapp = new WhatsAppMeow({
  sessionName: 'autoflow-wa',           // Nome da sessão
  sessionPath: './data/whatsapp-sessions', // Caminho dos dados
  autoReconnect: true,                   // Auto-reconectar
  webhookUrl: 'https://seu-servidor.com/webhook', // URL para webhook
  puppeteerOptions: {
    headless: true,                      // Modo headless
    executablePath: '/usr/bin/chromium', // Caminho do Chrome
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  }
});

await whatsapp.initialize();
```

### Variáveis de Ambiente

Crie um arquivo `.env`:

```env
# WhatsApp MEOW Configuration
WHATSAPP_SESSION_DIR=./data/whatsapp-sessions
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WHATSAPP_WEBHOOK_URL=https://seu-servidor.com/webhook
SKIP_WHATSAPP=false  # Set to true to disable WhatsApp in tests
```

## 📚 API Reference

### WhatsAppMeow Class

#### Métodos Principais

##### `initialize(): Promise<void>`
Inicializa o cliente WhatsApp e aguarda autenticação.

##### `sendMessage(to: string, message: string): Promise<{ id: string; timestamp: number }>`
Envia mensagem de texto.

**Parâmetros:**
- `to` - Número no formato `5511999999999` ou `5511999999999@c.us`
- `message` - Texto da mensagem

**Retorna:** ID e timestamp da mensagem enviada

##### `sendMedia(to: string, mediaUrl: string, options?: WhatsAppMediaOptions): Promise<{ id: string; timestamp: number }>`
Envia mídia (imagem, vídeo, áudio, documento).

**Parâmetros:**
- `to` - Número do destinatário
- `mediaUrl` - URL da mídia ou base64 (`data:image/jpeg;base64,...`)
- `options` - Configurações opcionais:
  - `caption?: string` - Legenda da mídia
  - `sendMediaAsDocument?: boolean` - Enviar como documento
  - `filename?: string` - Nome do arquivo

##### `sendLocation(to: string, latitude: number, longitude: number, description?: string): Promise<{ id: string; timestamp: number }>`
Envia localização GPS.

##### `getContact(phoneNumber: string): Promise<WhatsAppContact | null>`
Busca informações de um contato.

##### `getContacts(): Promise<WhatsAppContact[]>`
Lista todos os contatos.

##### `getGroups(): Promise<WhatsAppGroup[]>`
Lista todos os grupos.

##### `createGroup(name: string, participants: string[]): Promise<WhatsAppGroup>`
Cria novo grupo.

##### `addParticipantsToGroup(groupId: string, participants: string[]): Promise<void>`
Adiciona participantes a um grupo.

##### `setPresence(available: boolean): Promise<void>`
Define status online/offline.

##### `markAsRead(chatId: string): Promise<void>`
Marca chat como lido.

##### `getStatus(): WhatsAppStatus`
Retorna status atual da conexão.

##### `disconnect(): Promise<void>`
Desconecta o cliente (mantém sessão).

##### `logout(): Promise<void>`
Faz logout e remove sessão (precisa escanear QR novamente).

#### Eventos

O WhatsApp MEOW é um `EventEmitter`. Eventos disponíveis:

```typescript
whatsapp.on('qr', (qr: string) => {
  console.log('QR Code gerado:', qr);
});

whatsapp.on('ready', () => {
  console.log('WhatsApp pronto!');
});

whatsapp.on('authenticated', () => {
  console.log('Autenticado com sucesso');
});

whatsapp.on('auth_failure', (error: any) => {
  console.error('Falha na autenticação:', error);
});

whatsapp.on('disconnected', (reason: string) => {
  console.log('Desconectado:', reason);
});

whatsapp.on('message', (msg: WhatsAppMessage) => {
  console.log('Mensagem recebida:', msg);
});

whatsapp.on('message_ack', ({ messageId, status }) => {
  console.log(`Mensagem ${messageId} está ${status}`);
  // status: 'error' | 'pending' | 'server' | 'device' | 'read' | 'played'
});

whatsapp.on('group_join', ({ groupId, participants }) => {
  console.log('Entrou em grupo:', groupId);
});

whatsapp.on('group_leave', ({ groupId, participants }) => {
  console.log('Saiu de grupo:', groupId);
});
```

### Tipos TypeScript

```typescript
interface WhatsAppConfig {
  sessionName?: string;
  sessionPath?: string;
  puppeteerOptions?: {
    headless?: boolean;
    args?: string[];
    executablePath?: string;
  };
  autoReconnect?: boolean;
  webhookUrl?: string;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  isGroup: boolean;
  author?: string;
  type: 'chat' | 'image' | 'video' | 'audio' | 'document' | 'ptt' | 'sticker';
}

interface WhatsAppContact {
  id: string;
  name: string;
  number: string;
  pushname?: string;
  isMyContact: boolean;
  isBlocked: boolean;
}

interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
  participants: Array<{
    id: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }>;
  inviteCode?: string;
}

interface WhatsAppStatus {
  isConnected: boolean;
  isReady: boolean;
  batteryLevel?: number;
  phoneNumber?: string;
  platform?: string;
  sessionState: 'disconnected' | 'connecting' | 'qr' | 'authenticated' | 'ready';
}
```

## 🎯 Exemplos de Uso

### Exemplo 1: Bot de Atendimento Automático

```typescript
import { getWhatsAppInstance } from './services/whatsappMeow';

const whatsapp = getWhatsAppInstance();

// Inicializar
await whatsapp.initialize();

// Aguardar estar pronto
whatsapp.on('ready', () => {
  console.log('Bot de atendimento iniciado!');
});

// Responder mensagens
whatsapp.onMessage('atendimento-bot', async (msg) => {
  const mensagem = msg.body.toLowerCase();
  
  // Ignorar mensagens de grupos
  if (msg.isGroup) return;
  
  // Cardápio de opções
  if (mensagem.includes('cardapio') || mensagem === '1') {
    await whatsapp.sendMessage(msg.from, `
🍕 *CARDÁPIO*

1️⃣ Pizza Margherita - R$ 45
2️⃣ Pizza Calabresa - R$ 48
3️⃣ Pizza Portuguesa - R$ 50

Digite o número para pedir!
    `);
  }
  
  // Pedido
  else if (['1', '2', '3'].includes(mensagem)) {
    await whatsapp.sendMessage(msg.from, `
✅ Pedido confirmado!

Seu pedido será entregue em 40-50 minutos.
Obrigado pela preferência! 🍕
    `);
  }
  
  // Mensagem padrão
  else {
    await whatsapp.sendMessage(msg.from, `
👋 Olá! Bem-vindo à Pizzaria AutoFlow!

Digite *cardápio* para ver nossas pizzas.
    `);
  }
});
```

### Exemplo 2: Envio de Notificações

```typescript
import { getWhatsAppInstance } from './services/whatsappMeow';

const whatsapp = getWhatsAppInstance();

async function notificarClientes(clientes: string[], mensagem: string) {
  for (const numero of clientes) {
    try {
      await whatsapp.sendMessage(numero, mensagem);
      console.log(`✅ Notificação enviada para ${numero}`);
      
      // Delay para evitar bloqueio
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Erro ao enviar para ${numero}:`, error);
    }
  }
}

// Uso
const clientes = ['5511999999999', '5511888888888'];
await notificarClientes(clientes, `
🎉 PROMOÇÃO ESPECIAL!

Todas as pizzas com 30% de desconto hoje!
Válido até 23:59.
`);
```

### Exemplo 3: Chatbot com IA

```typescript
import { getWhatsAppInstance } from './services/whatsappMeow';
import OpenAI from 'openai';

const whatsapp = getWhatsAppInstance();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const conversas = new Map<string, any[]>();

whatsapp.onMessage('chatbot-ia', async (msg) => {
  if (msg.isGroup) return;
  
  // Buscar histórico da conversa
  const historico = conversas.get(msg.from) || [];
  historico.push({ role: 'user', content: msg.body });
  
  // Gerar resposta com GPT
  const resposta = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente virtual da Pizzaria AutoFlow. Seja prestativo e amigável.'
      },
      ...historico
    ]
  });
  
  const textoResposta = resposta.choices[0].message.content;
  
  // Salvar no histórico
  historico.push({ role: 'assistant', content: textoResposta });
  conversas.set(msg.from, historico.slice(-10)); // Manter últimas 10 mensagens
  
  // Enviar resposta
  await whatsapp.sendMessage(msg.from, textoResposta);
});
```

## ⚠️ Avisos Importantes

### Limites e Restrições

1. **WhatsApp Web Limitations**
   - Não é uma API oficial do WhatsApp
   - Pode ser bloqueado se enviar muitas mensagens rapidamente
   - Requer WhatsApp instalado no celular
   - Depende de conexão com internet no celular

2. **Recomendações de Uso**
   - **POC/Desenvolvimento**: Perfeito para protótipos
   - **Produção (baixo volume)**: OK para pequenos negócios
   - **Produção (alto volume)**: Use WhatsApp Business API oficial

3. **Evite Bloqueios**
   - Não envie mais de 1 mensagem por segundo
   - Não envie spam ou mensagens não solicitadas
   - Use delays entre mensagens (2-5 segundos)
   - Não use para envios em massa (>100 mensagens/hora)

### Alternativas para Produção

Para uso em larga escala, considere:

- **WhatsApp Business API** (oficial)
- **Twilio WhatsApp API**
- **Avisa WhatsApp API** (Brasil)
- **Zenvia WhatsApp API** (Brasil)

## 🐛 Troubleshooting

### "WhatsApp client não está pronto"

**Solução:** Aguarde a conexão ser estabelecida. Verifique se o QR Code foi escaneado.

```typescript
whatsapp.on('ready', () => {
  console.log('Agora pode enviar mensagens!');
});
```

### "Authentication failure"

**Soluções:**
1. Delete a pasta de sessão e escaneie o QR novamente
2. Verifique se o WhatsApp Web está atualizado no celular
3. Use `logout()` e reconfigure

### "Connection timeout"

**Soluções:**
1. Verifique sua conexão com internet
2. Aumente o timeout do Puppeteer
3. Tente desabilitar headless mode para debug

```typescript
const whatsapp = new WhatsAppMeow({
  puppeteerOptions: {
    headless: false // Mostra o navegador
  }
});
```

### Mensagens não chegam

**Checklist:**
1. Status está "ready"? Use `getStatus()`
2. Número está no formato correto? (sem + e sem espaços)
3. Celular está conectado à internet?
4. WhatsApp Web está vinculado?

## 📊 Monitoramento

### Dashboard em Tempo Real

O AutoFlow inclui um dashboard completo:

- **Status da Conexão** - Conectado/Desconectado
- **Informações do Dispositivo** - Número, plataforma, bateria
- **Logs de Atividade** - Todas as operações em tempo real
- **Mensagens Recentes** - Últimas 50 mensagens recebidas
- **Teste de Envio** - Interface para testar mensagens
- **Ações Rápidas** - Ver grupos, contatos, enviar mídia

Acesse via: Menu → WhatsApp

### Logs Programáticos

```typescript
// Monitorar todas as mensagens
whatsapp.onMessage('logger', (msg) => {
  console.log(`[${new Date().toISOString()}] ${msg.from}: ${msg.body}`);
});

// Monitorar status
whatsapp.on('disconnected', () => {
  console.error('❌ WhatsApp desconectado!');
  // Notificar administradores
});

// Monitorar confirmações
whatsapp.on('message_ack', ({ messageId, status }) => {
  if (status === 'read') {
    console.log(`✅ Mensagem ${messageId} foi lida`);
  }
});
```

## 🔐 Segurança

### Boas Práticas

1. **Proteja a Pasta de Sessão**
   ```bash
   chmod 700 data/whatsapp-sessions
   ```

2. **Use .gitignore**
   ```gitignore
   data/whatsapp-sessions/
   .wwebjs_auth/
   .wwebjs_cache/
   ```

3. **Não Compartilhe QR Codes**
   - Nunca compartilhe capturas de tela do QR
   - Gere um novo QR se suspeitar de comprometimento

4. **Autenticação de Webhooks**
   ```typescript
   const whatsapp = new WhatsAppMeow({
     webhookUrl: 'https://seu-servidor.com/webhook?token=SEU_TOKEN_SECRETO'
   });
   ```

## 🚀 Deploy em Produção

### Docker

```dockerfile
FROM node:18

WORKDIR /app

# Instalar dependências do Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1

# Copiar arquivos
COPY package*.json ./
RUN npm install

COPY . .

# Build
RUN npm run build

# Variáveis de ambiente
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV WHATSAPP_SESSION_DIR=/app/data/whatsapp-sessions

# Volume para persistir sessão
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["npm", "run", "whatsapp:start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  autoflow-whatsapp:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - whatsapp-data:/app/data
    environment:
      - NODE_ENV=production
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
    restart: unless-stopped

volumes:
  whatsapp-data:
```

## 📖 Recursos Adicionais

- [whatsapp-web.js Documentation](https://wwebjs.dev/)
- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-repo/autoflow/issues)
- **Discord**: [AutoFlow Community](https://discord.gg/autoflow)
- **Email**: suporte@autoflow.com.br

---

**Desenvolvido com ❤️ pela equipe AutoFlow**
