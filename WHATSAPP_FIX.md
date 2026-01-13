# WhatsApp MEOW - Quick Start

## ✅ Arquitetura Corrigida

O WhatsApp MEOW agora roda corretamente com arquitetura cliente-servidor:

- **Backend**: `connectors/whatsapp/server.js` (porta 5050) - Roda o whatsapp-web.js
- **Frontend**: `components/WhatsAppManager.tsx` - Interface gráfica
- **API Client**: `services/whatsappClient.ts` - Cliente HTTP para comunicação

## 🚀 Como Usar

### 1. Inicie o Servidor WhatsApp (Backend)

Em um terminal:
```bash
cd /home/cleber_delgado/workspace/AutoFlow-main
npm run whatsapp:start
```

Ou com auto-reload:
```bash
npm run whatsapp:dev
```

O servidor iniciará na porta **5050**.

### 2. Inicie o Frontend (Vite)

Em outro terminal:
```bash
npm run dev
```

O frontend iniciará na porta **3000** e automaticamente proxy `/api/whatsapp` para `http://localhost:5050`.

### 3. Acesse o WhatsApp Manager

1. Abra `http://localhost:3000`
2. No menu lateral, clique em **"WhatsApp"**
3. Clique em **"Conectar"**
4. Escaneie o QR Code com seu WhatsApp

## 📡 Endpoints API

Todos os endpoints estão em `http://localhost:5050/api/whatsapp/`:

### GET /api/whatsapp/status
Retorna status da conexão:
```json
{
  "isConnected": true,
  "isReady": true,
  "batteryLevel": 85,
  "phoneNumber": "5511999999999",
  "platform": "android",
  "sessionState": "ready"
}
```

### GET /api/whatsapp/qr
Retorna QR Code atual (ou null):
```json
{
  "qrCode": "1@ABC123..."
}
```

### POST /api/whatsapp/connect
Inicia conexão WhatsApp.

### POST /api/whatsapp/disconnect
Desconecta (mantém sessão).

### POST /api/whatsapp/logout
Faz logout (remove sessão).

### POST /api/whatsapp/send
Envia mensagem:
```json
{
  "to": "5511999999999",
  "message": "Olá!"
}
```

Resposta:
```json
{
  "id": "true_5511999999999@c.us_...",
  "timestamp": 1705179600
}
```

### GET /api/whatsapp/messages?limit=50
Retorna mensagens recentes:
```json
{
  "messages": [
    {
      "id": "...",
      "from": "5511999999999@c.us",
      "to": "...",
      "body": "Olá!",
      "timestamp": 1705179600,
      "hasMedia": false,
      "isGroup": false,
      "type": "chat"
    }
  ]
}
```

### GET /api/whatsapp/contacts
Lista contatos.

### GET /api/whatsapp/groups
Lista grupos.

## 💻 Uso Programático

### Frontend (React/TypeScript)

```typescript
import { getWhatsAppClient } from './services/whatsappClient';

const whatsapp = getWhatsAppClient();

// Iniciar monitoramento
whatsapp.startMonitoring();

// Conectar
await whatsapp.connect();

// Enviar mensagem
await whatsapp.sendMessage('5511999999999', 'Olá!');

// Ouvir eventos
whatsapp.on('ready', () => {
  console.log('WhatsApp pronto!');
});

whatsapp.on('message', (msg) => {
  console.log('Nova mensagem:', msg.body);
});

// Parar monitoramento
whatsapp.stopMonitoring();
```

### Backend (Node.js)

```javascript
// O cliente WhatsApp já está configurado em server.js
// Acesse diretamente via requisições HTTP

const response = await fetch('http://localhost:5050/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '5511999999999',
    message: 'Olá do backend!'
  })
});

const result = await response.json();
console.log('Mensagem enviada:', result.id);
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# Servidor WhatsApp
PORT=5050
WHATSAPP_SESSION_DIR=./data/whatsapp-sessions
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Desabilitar WhatsApp (para testes)
SKIP_WHATSAPP=false
```

### Vite Config (vite.config.ts)

O proxy já está configurado:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5050',
    changeOrigin: true
  }
}
```

E `whatsapp-web.js` está excluído do bundle:
```typescript
optimizeDeps: {
  exclude: ['whatsapp-web.js', 'qrcode-terminal']
}
```

## 🐛 Troubleshooting

### Erro: "Could not resolve WAWebPollsVotesSchema"

✅ **RESOLVIDO!** O erro ocorria porque tentávamos usar `whatsapp-web.js` no navegador. Agora roda apenas no servidor Node.js.

### Servidor não conecta

1. Verifique se a porta 5050 está livre:
   ```bash
   lsof -i :5050
   ```

2. Inicie o servidor manualmente:
   ```bash
   npm run whatsapp:start
   ```

3. Verifique os logs no terminal

### QR Code não aparece

1. Verifique se o servidor está rodando
2. Acesse `http://localhost:5050/api/whatsapp/qr` diretamente
3. Tente desconectar e reconectar

### Mensagens não chegam

1. Verifique status: `http://localhost:5050/api/whatsapp/status`
2. Certifique-se que `sessionState === 'ready'`
3. Formato do número: `5511999999999` (sem + e sem espaços)

## 📦 Deploy

### Docker Compose

```yaml
version: '3.8'

services:
  whatsapp-server:
    build: .
    ports:
      - "5050:5050"
    volumes:
      - whatsapp-data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=5050
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    depends_on:
      - whatsapp-server
    restart: unless-stopped

volumes:
  whatsapp-data:
```

### Executar Simultaneamente (Dev)

Use `npm-run-all`:

```bash
npm install -D npm-run-all
```

Adicione ao `package.json`:
```json
{
  "scripts": {
    "dev:full": "npm-run-all --parallel dev server"
  }
}
```

Execute:
```bash
npm run dev:full
```

## ✅ Checklist de Funcionamento

- [x] `whatsapp-web.js` excluído do Vite
- [x] Servidor backend rodando na porta 5050
- [x] Frontend conectando via API REST
- [x] QR Code funcionando
- [x] Envio de mensagens OK
- [x] Recebimento de mensagens OK
- [x] Status em tempo real
- [x] Interface gráfica completa

## 📚 Documentação Completa

Para guia completo, veja: [WHATSAPP_MEOW_GUIDE.md](./WHATSAPP_MEOW_GUIDE.md)

---

**Problema Resolvido! ✅** Agora o WhatsApp funciona perfeitamente com arquitetura cliente-servidor apropriada.
