import express from 'express';
import path from 'path';
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';

const app = express();
app.use(express.json());

// Serve frontend built by Vite from /dist
app.use(express.static(path.join(process.cwd(), 'dist')));
app.get('*', (req, res) => {
  const index = path.join(process.cwd(), 'dist', 'index.html');
  if (require('fs').existsSync(index)) return res.sendFile(index);
  res.status(404).send('Not Found');
});

// In-memory POC data (mirrors TestChat seeds)
const services = [ { id: 's1', title: 'Limpeza de Pele', durationMinutes: 60, locationId: 'l1' } ];
const availabilityList = [
  { professionalId: 'p1', start: '2025-12-26T09:00:00.000Z', end: '2025-12-26T17:00:00.000Z' },
  { professionalId: 'p2', start: '2025-12-26T09:00:00.000Z', end: '2025-12-26T12:00:00.000Z' }
];
const appointments = [];

function toTs(iso) { return new Date(iso).getTime(); }
function rangesOverlap(a0, a1, b0, b1) { return Math.max(a0, b0) < Math.min(a1, b1); }

function findNextAvailableSlot(availability, appointmentsList, durationMinutes, fromISO) {
  const fromTs = fromISO ? toTs(fromISO) : Date.now();
  const durationMs = durationMinutes * 60 * 1000;

  const windows = availability
    .map(w => ({ ...w, startTs: toTs(w.start), endTs: toTs(w.end) }))
    .filter(w => w.endTs > fromTs)
    .sort((a, b) => a.startTs - b.startTs);

  for (const w of windows) {
    let candidateStart = Math.max(w.startTs, fromTs);
    while (candidateStart + durationMs <= w.endTs) {
      const candidateEnd = candidateStart + durationMs;
      const candidateStartISO = new Date(candidateStart).toISOString();
      const candidateEndISO = new Date(candidateEnd).toISOString();

      const conflict = appointmentsList.some(a => a.professionalId === w.professionalId && a.status !== 'CANCELLED' && rangesOverlap(toTs(a.start), toTs(a.end), toTs(candidateStartISO), toTs(candidateEndISO)));
      if (!conflict) {
        return { start: candidateStartISO, end: candidateEndISO };
      }

      // advance by 5 minutes
      candidateStart += 5 * 60 * 1000;
    }
  }
  return null;
}

// WhatsApp client
const sessionDir = process.env.WHATSAPP_SESSION_DIR || '/data/whatsapp';
const puppeteerExecutable = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'autoflow-poc', dataPath: sessionDir }),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'], executablePath: puppeteerExecutable }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Escaneie o QR acima com o WhatsApp (Configurar > Dispositivos).');
});

client.on('ready', () => console.log('WhatsApp client ready!'));

client.on('message', async msg => {
  console.log('Mensagem recebida:', msg.from, msg.body);
  const text = (msg.body || '').trim().toLowerCase();

  if (text.includes('agendar')) {
    const slot = findNextAvailableSlot(availabilityList, appointments, services[0].durationMinutes, new Date().toISOString());
    if (slot) {
      await msg.reply(`Sugestão: ${slot.start} → ${slot.end}\nResponda CONFIRMAR para marcar.`);
    } else {
      await msg.reply('Nenhuma vaga disponível no momento.');
    }
    return;
  }

  if (text.includes('confirmar')) {
    // naive confirm using previously suggested slot (for POC use first availability)
    const slot = findNextAvailableSlot(availabilityList, appointments, services[0].durationMinutes, new Date().toISOString());
    if (!slot) {
      await msg.reply('Não há vagas para confirmar.');
      return;
    }
    const id = `a_${Date.now()}`;
    const appt = { id, clientId: msg.from, professionalId: 'p1', serviceId: 's1', start: slot.start, end: slot.end, status: 'CONFIRMED', createdAt: new Date().toISOString() };
    appointments.push(appt);
    await msg.reply(`Agendamento criado: ${id} para ${slot.start}`);
    return;
  }

  await msg.reply('Olá! Envie "agendar" para buscar disponibilidade.');
});

// Endpoint to send message (AutoFlow -> WhatsApp)
app.post('/send', async (req, res) => {
  const { to, text } = req.body;
  if (!to || !text) return res.status(400).json({ error: 'to and text required' });
  try {
    await client.sendMessage(to, text);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'send_failed' });
  }
});

// POC endpoints for AutoFlow to call locally
app.post('/api/poc/find-availability', (req, res) => {
  const { professionalId, serviceId, durationMinutes, fromISO } = req.body;
  const duration = durationMinutes || (serviceId ? (services.find(s => s.id === serviceId)?.durationMinutes || 60) : 60);
  const availability = availabilityList.filter(w => !professionalId || w.professionalId === professionalId);
  const slot = findNextAvailableSlot(availability, appointments, duration, fromISO);
  if (!slot) return res.json({ found: false });
  res.json({ found: true, suggestedStart: slot.start, suggestedEnd: slot.end });
});

app.post('/api/poc/create-appointment', (req, res) => {
  const { clientId, professionalId, serviceId, start, end } = req.body;
  if (!professionalId || !start || !end) return res.status(400).json({ error: 'professionalId, start and end required' });
  const id = `a_${Date.now()}`;
  const appt = { id, clientId: clientId || null, professionalId, serviceId, start, end, status: 'CONFIRMED', createdAt: new Date().toISOString() };
  appointments.push(appt);
  res.json(appt);
});

client.initialize();

const PORT = process.env.WHATSAPP_PORT || 3333;
app.listen(PORT, () => console.log(`WhatsApp connector running at http://localhost:${PORT}`));
