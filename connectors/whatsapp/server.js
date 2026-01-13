import express from 'express';
import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

const app = express();
app.use(express.json());

// WhatsApp client configuration
const sessionDir = process.env.WHATSAPP_SESSION_DIR || './data/whatsapp-sessions';
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'autoflow', dataPath: sessionDir }),
  puppeteer: { 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Estado para API
let currentQrCode = null;
const recentMessages = [];

// WhatsApp Events
client.on('qr', (qr) => {
  currentQrCode = qr;
  qrcode.generate(qr, { small: true });
  console.log('📱 QR Code gerado! Escan eie com WhatsApp.');
});

client.on('ready', () => {
  currentQrCode = null;
  console.log('✅ WhatsApp conectado e pronto!');
});

client.on('authenticated', () => {
  console.log('🔐 WhatsApp autenticado!');
});

client.on('disconnected', (reason) => {
  currentQrCode = null;
  console.log('⚠️ WhatsApp desconectado:', reason);
});

client.on('message', async (msg) => {
  try {
    recentMessages.unshift({
      id: msg.id._serialized,
      from: msg.from,
      to: msg.to,
      body: msg.body || '',
      timestamp: msg.timestamp,
      hasMedia: msg.hasMedia,
      isGroup: msg.from.includes('@g.us'),
      author: msg.author,
      type: msg.type
    });
    if (recentMessages.length > 100) recentMessages.splice(100);
  } catch (e) {
    console.error('Erro ao armazenar mensagem:', e);
  }
});

// === API Endpoints ===

// Status da conexão
app.get('/api/whatsapp/status', (req, res) => {
  try {
    const state = client.info ? 'ready' : (currentQrCode ? 'qr' : 'disconnected');
    res.json({
      isConnected: !!client.info,
      isReady: !!client.info,
      batteryLevel: client.info?.battery || null,
      phoneNumber: client.info?.wid?.user || null,
      platform: client.info?.platform || null,
      sessionState: state
    });
  } catch (error) {
    res.json({ isConnected: false, isReady: false, sessionState: 'disconnected' });
  }
});

// QR Code atual
app.get('/api/whatsapp/qr', (req, res) => {
  res.json({ qrCode: currentQrCode });
});

// Conectar
app.post('/api/whatsapp/connect', async (req, res) => {
  try {
    if (!client.info) {
      client.initialize();
    }
    res.json({ ok: true, message: 'Inicializando conexão...' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desconectar
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    await client.destroy();
    currentQrCode = null;
    res.json({ ok: true, message: 'Desconectado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout (remove sessão)
app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    await client.logout();
    currentQrCode = null;
    res.json({ ok: true, message: 'Sessão removida' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensagem
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'Parâmetros "to" e "message" são obrigatórios' });
    }
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    const sent = await client.sendMessage(chatId, message);
    res.json({ 
      ok: true,
      id: sent.id._serialized, 
      timestamp: sent.timestamp 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mensagens recentes
app.get('/api/whatsapp/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ messages: recentMessages.slice(0, limit) });
});

// Listar contatos
app.get('/api/whatsapp/contacts', async (req, res) => {
  try {
    const contacts = await client.getContacts();
    res.json({ 
      contacts: contacts.map(c => ({
        id: c.id._serialized,
        name: c.name || c.pushname || c.number,
        number: c.number,
        isMyContact: c.isMyContact,
        isBlocked: c.isBlocked
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar grupos
app.get('/api/whatsapp/groups', async (req, res) => {
  try {
    const chats = await client.getChats();
    const groups = chats.filter(c => c.isGroup);
    res.json({ 
      groups: groups.map(g => ({
        id: g.id._serialized,
        name: g.name
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'whatsapp-api' });
});

// Start server
const PORT = process.env.PORT || process.env.WHATSAPP_PORT || 5050;
app.listen(PORT, () => {
  console.log(`🟢 WhatsApp API Server rodando em http://localhost:${PORT}`);
  console.log(`📱 Aguardando conexão WhatsApp...`);
  console.log(`🔗 Endpoints disponíveis:`);
  console.log(`   GET  /api/whatsapp/status`);
  console.log(`   GET  /api/whatsapp/qr`);
  console.log(`   POST /api/whatsapp/connect`);
  console.log(`   POST /api/whatsapp/disconnect`);
  console.log(`   POST /api/whatsapp/send`);
  console.log(`   GET  /api/whatsapp/messages`);
  console.log(`   GET  /api/whatsapp/contacts`);
  console.log(`   GET  /api/whatsapp/groups`);
});
