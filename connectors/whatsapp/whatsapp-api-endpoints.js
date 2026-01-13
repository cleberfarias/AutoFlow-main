// WhatsApp Frontend API - Adicionar ao connectors/whatsapp/server.js

// Estado global para API
let currentQrCode = null;
const recentMessages = [];

// Interceptar eventos do cliente WhatsApp
const originalClientOn = client.on.bind(client);

client.on('qr', (qr) => {
  currentQrCode = qr;
  console.log('📱 QR Code disponível para autenticação');
});

client.on('ready', () => {
  currentQrCode = null;
  console.log('✅ Cliente WhatsApp pronto');
});

client.on('message', async (msg) => {
  // Armazenar mensagens recentes
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
    
    // Manter apenas últimas 100 mensagens
    if (recentMessages.length > 100) {
      recentMessages.splice(100);
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
});

// === WhatsApp Frontend API Endpoints ===

// GET /api/whatsapp/status - Status da conexão
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
    res.json({
      isConnected: false,
      isReady: false,
      sessionState: 'disconnected'
    });
  }
});

// GET /api/whatsapp/qr - QR Code atual
app.get('/api/whatsapp/qr', (req, res) => {
  res.json({ qrCode: currentQrCode });
});

// POST /api/whatsapp/connect - Conectar WhatsApp
app.post('/api/whatsapp/connect', async (req, res) => {
  try {
    if (!client.info && !process.env.SKIP_WHATSAPP) {
      await client.initialize();
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/whatsapp/disconnect - Desconectar
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    await client.destroy();
    currentQrCode = null;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/whatsapp/logout - Logout e remover sessão
app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    await client.logout();
    currentQrCode = null;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/whatsapp/send - Enviar mensagem
app.post('/api/whatsapp/send', async (req, res) => {
  const { to, message } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ error: 'to and message required' });
  }
  
  try {
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    const sent = await client.sendMessage(chatId, message);
    
    res.json({
      id: sent.id._serialized,
      timestamp: sent.timestamp
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/whatsapp/send-media - Enviar mídia
app.post('/api/whatsapp/send-media', async (req, res) => {
  const { to, mediaUrl, options = {} } = req.body;
  
  if (!to || !mediaUrl) {
    return res.status(400).json({ error: 'to and mediaUrl required' });
  }
  
  try {
    const { MessageMedia } = pkg;
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    
    let media;
    if (mediaUrl.startsWith('http')) {
      media = await MessageMedia.fromUrl(mediaUrl);
    } else {
      const [mimetype, data] = mediaUrl.split(';base64,');
      media = new MessageMedia(mimetype.replace('data:', ''), data, options.filename);
    }
    
    const sent = await client.sendMessage(chatId, media, {
      caption: options.caption,
      sendMediaAsDocument: options.sendMediaAsDocument
    });
    
    res.json({
      id: sent.id._serialized,
      timestamp: sent.timestamp
    });
  } catch (error) {
    console.error('Erro ao enviar mídia:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/whatsapp/messages - Mensagens recentes
app.get('/api/whatsapp/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ messages: recentMessages.slice(0, limit) });
});

// GET /api/whatsapp/contacts - Listar contatos
app.get('/api/whatsapp/contacts', async (req, res) => {
  try {
    const contacts = await client.getContacts();
    const formatted = contacts.map(c => ({
      id: c.id._serialized,
      name: c.name || c.pushname || c.number,
      number: c.number,
      pushname: c.pushname,
      isMyContact: c.isMyContact,
      isBlocked: c.isBlocked
    }));
    res.json({ contacts: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/whatsapp/groups - Listar grupos
app.get('/api/whatsapp/groups', async (req, res) => {
  try {
    const chats = await client.getChats();
    const groups = chats.filter(chat => chat.isGroup);
    
    const formatted = groups.map(group => ({
      id: group.id._serialized,
      name: group.name,
      description: group.groupMetadata?.desc || '',
      participants: group.groupMetadata?.participants?.map(p => ({
        id: p.id._serialized,
        isAdmin: p.isAdmin,
        isSuperAdmin: p.isSuperAdmin
      })) || []
    }));
    
    res.json({ groups: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
