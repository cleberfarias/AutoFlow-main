import express from 'express';
import path from 'path';
import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
import multer from 'multer';
const { Client, LocalAuth } = pkg;

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(express.json());

// Serve frontend built by Vite from /dist (only for non-API routes)
app.use(express.static(path.join(process.cwd(), 'dist')));
// Only serve index for non-/api paths to avoid catching API routes during tests
app.get(/^\/(?!api).*/, (req, res) => {
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

// In tests, avoid creating or initializing the WhatsApp client which tries to access /data.
if (process.env.NODE_ENV === 'test') {
  process.env.SKIP_WHATSAPP = '1';
  process.env.WHATSAPP_SESSION_DIR = process.env.WHATSAPP_SESSION_DIR || '/tmp/whatsapp-session';
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

import { detectIntent } from '../../server/intentService.js';

client.on('message', async msg => {
  try {
    console.log('Mensagem recebida:', msg.from, msg.body);
    const textRaw = (msg.body || '').trim();
    const text = textRaw.toLowerCase();

    // keep explicit keyword flows for scheduling first
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

    // intent-based handling using intentHandler (PoC)
    const { handleMessage } = await import('../../services/intentHandler.js');
    const { runAction } = await import('../../services/actionRunner.js');
    const { recordChatAction } = await import('../../server/chatAction.js');

    const result = await handleMessage(textRaw, { chatId: msg.from });

    // record the decision
    try {
      await recordChatAction({ chatId: msg.from, intentId: result.intent?.intentId || null, intentScore: result.intent?.score ?? null, actionType: result.action?.type || (result.clarification ? 'clarification' : 'fallback'), text: textRaw, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to record chat action:', err);
    }

    if (result.clarification) {
      // store pending confirmation if a proposed action exists
      if (result.proposedAction) {
        try {
          const { setPendingConfirmation } = await import('../../server/confirmation.js');
          await setPendingConfirmation(msg.from, { action: result.proposedAction, intent: result.intent, originalText: textRaw, timestamp: new Date().toISOString() });
        } catch (err) {
          console.error('Failed to set pending confirmation:', err);
        }
      }
      await msg.reply(result.clarification);
      return;
    }

    // check if user replied 'sim' to confirm a previous suggestion
    const normalized = textRaw.trim().toLowerCase();

    // negative confirmations
    if (['não', 'nao', 'n', 'na', 'nao,'].includes(normalized)) {
      try {
        const { clearPendingConfirmation, getPendingConfirmation } = await import('../../server/confirmation.js');
        const pending = await getPendingConfirmation(msg.from);
        if (pending) {
          await clearPendingConfirmation(msg.from);
          await msg.reply('Ok — não confirmei. Posso ajudar com outra coisa?');
          return;
        }
      } catch (err) {
        console.error('Error while handling negative confirmation:', err);
      }
    }

    if (['sim', 's', 'claro', 'confirmar'].includes(normalized)) {
      try {
        const { confirmPending, getPendingConfirmation } = await import('../../server/confirmation.js');
        const pending = await getPendingConfirmation(msg.from);
        if (pending) {
          const res = await confirmPending(msg.from);
          if (res && res.ok && res.text) {
            await msg.reply(res.text);
            return;
          }
          if (res && !res.ok) {
            await msg.reply('Ocorreu um erro ao confirmar, tente novamente mais tarde.');
            return;
          }
        }
      } catch (err) {
        console.error('Error while handling confirmation reply:', err);
      }
    }

    if (result.action) {
      const res = await runAction(result.action, { MSG_TEXT: textRaw, chatId: msg.from, intentId: result.intent?.intentId, intentScore: result.intent?.score });
      if (res.ok && res.text) {
        await msg.reply(res.text);
        return;
      }
    }

    // default fallback
    await msg.reply('Olá! Envie "agendar" para buscar disponibilidade ou escreva sua dúvida.');
  } catch (err) {
    console.error('Erro no handler de mensagem:', err);
    try { await msg.reply('Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.'); } catch (e) {}
  }
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

// ----- AutoFlow / ChatGuru endpoints (server-side implementations) -----

function parseJson(text) {
  try { return JSON.parse(text); } catch {}
  const match = String(text || '').match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function validatePatch(patch) {
  const errors = [];
  if (!patch || typeof patch !== 'object') return { valid: false, errors: ['patch_missing'] };
  const dialogs = patch.dialogs || [];
  const nodes = new Set(dialogs.map(d => d.dialog_node));
  if (nodes.size !== dialogs.length) errors.push('dialog_node values must be unique');
  for (const d of dialogs) {
    if (!d.dialog_node || !d.dialog_node.trim()) errors.push(`dialog missing dialog_node: temp_id=${d.temp_id}`);
    if (!d.title || !d.title.trim()) errors.push(`dialog missing title: ${d.dialog_node}`);
    (d.actions || []).forEach((a, i) => {
      if (a.type === 'RESPONDER' && (!a.params || !String(a.params.text || '').trim())) {
        errors.push(`dialog ${d.dialog_node} action[${i}] RESPONDER with empty text`);
      }
    });
  }
  for (const l of (patch.links || [])) {
    if (!nodes.has(l.source_node)) errors.push(`link source_node not found: ${l.source_node}`);
    if (!nodes.has(l.target_node)) errors.push(`link target_node not found: ${l.target_node}`);
    if (l.source_node === l.target_node) errors.push(`link cannot point to self: ${l.source_node}`);
  }
  return { valid: errors.length === 0, errors };
}

app.post('/api/autoflow/suggest', async (req, res) => {
  try {
    const { prompt, type } = req.body || {};
    const hasKey = !!process.env.OPENAI_API_KEY;
    if (hasKey) {
      try {
        const { getOpenAI } = await import('../../services/openaiClient');
        const openai = getOpenAI();
        if (type === 'workflow') {
          const messages = [
            { role: 'system', content: `Você é um Consultor Sênior de Crescimento para PMEs brasileiros. Responda SOMENTE com JSON no formato { "steps": [...] }.` },
            { role: 'user', content: `Pedido do cliente: "${prompt}"` }
          ];
          const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages });
          const content = response.choices[0]?.message?.content || '';
          const parsed = parseJson(content) || {};
          return res.json({ steps: parsed.steps || [] });
        }

        if (type === 'suggestions') {
          const messages = [
            { role: 'system', content: `Sugira 3 formas rápidas de aumentar o faturamento usando automação. Responda SOMENTE com JSON no formato { "suggestions": ["...", "...", "..."] }.` },
            { role: 'user', content: `Pedido: "${prompt}"` }
          ];
          const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages });
          const content = response.choices[0]?.message?.content || '';
          const parsed = parseJson(content) || {};
          return res.json({ suggestions: parsed.suggestions || [] });
        }

        return res.json({ ok: true });
      } catch (err) {
        console.error('OpenAI suggest error', err);
        return res.status(500).json({ error: 'suggest_llm_failed' });
      }
    }

    // fallback stub
    if (type === 'workflow') return res.json({ steps: [] });
    if (type === 'suggestions') return res.json({ suggestions: ['Fidelização Automática', 'Upsell no Checkout', 'Lembrete de Reagendamento'] });
    return res.json({ ok: true });
  } catch (err) {
    console.error('/api/autoflow/suggest error', err);
    res.status(500).json({ error: 'suggest_failed' });
  }
});

app.post('/api/autoflow/apply', async (req, res) => {
  try {
    const { bot_id, patch, mode } = req.body || {};
    if (!bot_id) return res.status(400).json({ error: 'bot_id_required' });
    const v = validatePatch(patch);
    if (!v.valid) return res.status(400).json({ error: 'patch_invalid', errors: v.errors });

    // If configured, forward to real ChatGuru API
    const base = process.env.CHATGURU_BASE_URL;
    try {
      if (base) {
        // Transform patch links into ChatGuru internal context/conditions representation
        const transformedPatch = JSON.parse(JSON.stringify(patch)); // deep clone
        const nodesByDialog = new Map((transformedPatch.dialogs || []).map(d => [d.dialog_node, d]));
        for (const l of (transformedPatch.links || [])) {
          const key = `${l.source_node}__${l.target_node}`;
          const source = nodesByDialog.get(l.source_node);
          const target = nodesByDialog.get(l.target_node);
          if (source) {
            source.context = source.context || {};
            source.context[key] = true;
          }
          if (target) {
            target.conditions_entry_contexts = target.conditions_entry_contexts || [];
            const cond = `$${key}==True`;
            if (!target.conditions_entry_contexts.includes(cond)) target.conditions_entry_contexts.push(cond);
          }
        }

        const endpoint = `${base.replace(/\/$/, '')}/api/autoflow/apply`;
        const headers = { 'Content-Type': 'application/json' };
        if (process.env.CHATGURU_API_KEY) headers['Authorization'] = `Bearer ${process.env.CHATGURU_API_KEY}`;
        const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ bot_id, patch: transformedPatch, mode }) });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`chatguru_apply_failed: ${resp.status} ${txt}`);
        }
        const body = await resp.json();
        return res.json({ ok: true, forwarded: true, body });
      }
    } catch (err) {
      console.error('Error forwarding to ChatGuru:', err);
      return res.status(502).json({ error: 'chatguru_forward_failed', message: String(err) });
    }

    // no forwarding configured: return stub success
    console.log('Applying ChatGuru patch (local stub)', { bot_id, mode, dialogs: (patch && patch.dialogs?.length) || 0, links: (patch && patch.links?.length) || 0 });
    return res.json({ ok: true, bot_id, mode, applied: true });
  } catch (err) {
    console.error('/api/autoflow/apply error', err);
    res.status(500).json({ error: 'apply_failed' });
  }
});

app.post('/api/autoflow/simulate', async (req, res) => {
  try {
    const { type, steps, triggerId, message } = req.body || {};
    const hasKey = !!process.env.OPENAI_API_KEY;
    if (hasKey) {
      try {
        const { getOpenAI } = await import('../../services/openaiClient');
        const openai = getOpenAI();
        if (type === 'start') {
          const trigger = (steps || [])[0] || null;
          const messages = [
            { role: 'system', content: `Você é o motor de execução AutoFlow. Processe o fluxo e responda sempre com JSON no formato {"userMessage":"...","actionName":"...","actionDescription":"...","stepId":"...","newVariables":{}}.` },
            { role: 'user', content: `FLUXO: ${JSON.stringify(steps)}. Passe: ${trigger ? trigger.title : ''}. Inicie a simulação.` }
          ];
          const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages });
          const content = response.choices[0]?.message?.content || '{}';
          return res.json({ raw: content });
        }
        if (type === 'message') {
          const messages = [ { role: 'system', content: `Contexto do fluxo: ${JSON.stringify(steps)}. Responda com JSON no formato {"userMessage":"...","actionName":"...","actionDescription":"...","stepId":"...","newVariables":{}}.` }, { role: 'user', content: message } ];
          const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages });
          const content = response.choices[0]?.message?.content || '{}';
          return res.json({ raw: content });
        }
      } catch (err) {
        console.error('simulate OpenAI error', err);
        return res.status(500).json({ error: 'simulate_llm_failed' });
      }
    }

    // fallback simple simulator
    if (type === 'start') {
      const trigger = (steps || [])[0] || null;
      return res.json({ raw: JSON.stringify({ userMessage: `Fluxo iniciado: ${trigger ? trigger.title : 'sem passo' }`, stepId: trigger ? trigger.id : null }) });
    }
    if (type === 'message') {
      return res.json({ raw: JSON.stringify({ userMessage: `Simulação: ${message}`, actionName: null, stepId: triggerId || (steps && steps[0] && steps[0].id) || null }) });
    }
    return res.status(400).json({ error: 'bad_request' });
  } catch (err) {
    console.error('/api/autoflow/simulate error', err);
    res.status(500).json({ error: 'simulate_failed' });
  }
});

app.post('/api/autoflow/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file_required' });
    if (process.env.OPENAI_API_KEY) {
      const tmp = `/tmp/autoflow_transcribe_${Date.now()}.webm`;
      const fs = await import('fs');
      await fs.promises.writeFile(tmp, req.file.buffer);
      try {
        const { getOpenAI } = await import('../../services/openaiClient');
        const openai = getOpenAI();
        const resp = await openai.audio.transcriptions.create({ file: fs.createReadStream(tmp), model: 'whisper-1' });
        await fs.promises.unlink(tmp);
        return res.json({ text: resp.text });
      } catch (err) {
        try { await fs.promises.unlink(tmp); } catch {}
        console.error('transcribe OpenAI error', err);
        return res.status(500).json({ error: 'transcribe_llm_failed' });
      }
    }
    // fallback stub
    res.json({ text: 'Transcrição de exemplo (stub).' });
  } catch (err) {
    console.error('/api/autoflow/transcribe error', err);
    res.status(500).json({ error: 'transcribe_failed' });
  }
});

app.post('/api/autoflow/llm', async (req, res) => {
  try {
    const { prompt, opts } = req.body || {};
    if (!process.env.OPENAI_API_KEY) return res.status(400).json({ error: 'openai_missing' });
    try {
      const { getOpenAI } = await import('../../services/openaiClient');
      const openai = getOpenAI();
      const messages = [];
      if (opts?.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
      messages.push({ role: 'user', content: prompt });
      const response = await openai.chat.completions.create({ model: opts?.model || 'gpt-4o-mini', messages, max_tokens: opts?.maxTokens || 350 });
      return res.json({ response: response.choices[0]?.message?.content || '' });
    } catch (err) {
      console.error('llm server error', err);
      return res.status(500).json({ error: 'llm_failed' });
    }
  } catch (err) {
    console.error('/api/autoflow/llm error', err);
    res.status(500).json({ error: 'llm_failed' });
  }
});

// Metrics endpoint (protected)
app.get('/api/metrics', requireApiKey, async (req, res) => {
  try {
    const { getAll } = await import('../../server/metrics.js');
    res.json(getAll());
  } catch (err) {
    res.status(500).json({ error: 'metrics_unavailable' });
  }
});
// --- Admin Endpoints (Tags / Funnels / Status) ---
app.get('/api/admin/tags/:chatId', requireApiKey, async (req, res) => {
  try {
    const { getTags } = await import('../../server/tags.js');
    const tags = await getTags(req.params.chatId);
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: 'tags_unavailable' });
  }
});

app.post('/api/admin/tags/:chatId', requireApiKey, async (req, res) => {
  const { tag } = req.body || {};
  if (!tag) return res.status(400).json({ error: 'tag_required' });
  try {
    const { addTag } = await import('../../server/tags.js');
    const tags = await addTag(req.params.chatId, tag);
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: 'tag_add_failed' });
  }
});

app.delete('/api/admin/tags/:chatId/:tag', requireApiKey, async (req, res) => {
  try {
    const { removeTag } = await import('../../server/tags.js');
    const ok = await removeTag(req.params.chatId, req.params.tag);
    res.json({ ok });
  } catch (err) {
    res.status(500).json({ error: 'tag_remove_failed' });
  }
});

app.get('/api/admin/funnels', requireApiKey, async (req, res) => {
  try {
    const db = await import('../../server/db.js');
    res.json(db.default.data?.funnels || {});
  } catch (err) {
    res.status(500).json({ error: 'funnels_unavailable' });
  }
});

// Agents management (CRUD, availability)
app.get('/api/admin/agents', requireApiKey, async (req, res) => {
  try {
    const { listAgents } = await import('../../server/agents.js');
    const agents = await listAgents();
    res.json({ agents });
  } catch (err) { res.status(500).json({ error: 'agents_unavailable' }); }
});

app.post('/api/admin/agents', requireApiKey, async (req, res) => {
  const { id, name } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id_required' });
  try {
    const { addAgent } = await import('../../server/agents.js');
    const a = await addAgent(id, name || id);
    res.json(a);
  } catch (err) { res.status(500).json({ error: 'add_agent_failed' }); }
});

app.delete('/api/admin/agents/:id', requireApiKey, async (req, res) => {
  try {
    const { removeAgent } = await import('../../server/agents.js');
    const ok = await removeAgent(req.params.id);
    res.json({ ok });
  } catch (err) { res.status(500).json({ error: 'remove_agent_failed' }); }
});

app.post('/api/admin/agents/:id/status', requireApiKey, async (req, res) => {
  const { available } = req.body || {};
  if (available === undefined) return res.status(400).json({ error: 'available_required' });
  try {
    const { setAgentAvailability } = await import('../../server/agents.js');
    const a = await setAgentAvailability(req.params.id, !!available);
    if (!a) return res.status(404).json({ error: 'not_found' });
    res.json(a);
  } catch (err) { res.status(500).json({ error: 'set_availability_failed' }); }
});

// Agent endpoints to accept/reject delegation
app.post('/api/agents/:id/accept', async (req, res) => {
  const agentId = req.params.id;
  const { chatId } = req.body || {};
  if (!chatId) return res.status(400).json({ error: 'chatId_required' });
  try {
    const { getChatAssignment, acceptAssignment } = await import('../../server/agents.js');
    const { recordChatAction } = await import('../../server/chatAction.js');
    const assignment = await getChatAssignment(chatId);
    if (!assignment || assignment.agentId !== agentId) return res.status(404).json({ error: 'assignment_not_found' });
    const ok = await acceptAssignment(chatId, agentId);
    if (!ok) return res.status(500).json({ error: 'accept_failed' });
    try { const { setChatStatus } = await import('../../server/status.js'); await setChatStatus(chatId, `in_conversation:${agentId}`); } catch (e) {}
    await recordChatAction({ chatId, intentId: null, intentScore: null, actionType: 'AGENT_ACCEPT', text: `accepted_by:${agentId}`, timestamp: new Date().toISOString() });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'accept_exception' }); }
});

app.post('/api/agents/:id/reject', async (req, res) => {
  const agentId = req.params.id;
  const { chatId } = req.body || {};
  if (!chatId) return res.status(400).json({ error: 'chatId_required' });
  try {
    const { getChatAssignment, rejectAssignment, getNextAgent, assignChat } = await import('../../server/agents.js');
    const { recordChatAction } = await import('../../server/chatAction.js');
    const assignment = await getChatAssignment(chatId);
    if (!assignment || assignment.agentId !== agentId) return res.status(404).json({ error: 'assignment_not_found' });
    const ok = await rejectAssignment(chatId, agentId);
    if (!ok) return res.status(500).json({ error: 'reject_failed' });
    await recordChatAction({ chatId, intentId: null, intentScore: null, actionType: 'AGENT_REJECT', text: `rejected_by:${agentId}`, timestamp: new Date().toISOString() });
    // try to reassign immediately
    const next = await getNextAgent();
    if (next) {
      await assignChat(chatId, next.id);
      try { const { forwardMessage } = await import('../../server/forward.js'); await forwardMessage(chatId, next.id, JSON.stringify({ type: 'delegation', chatId, message: `Nova delegação: ${chatId}`, agentId: next.id, instructions: 'Responda /accept ou /reject via API' })); } catch (e) {}
    }
    res.json({ ok: true, reassignedTo: next ? next.id : null });
  } catch (err) { res.status(500).json({ error: 'reject_exception' }); }
});

app.post('/api/admin/funnels', requireApiKey, async (req, res) => {
  const { id, name } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id_required' });
  try {
    const { createFunnel } = await import('../../server/funnels.js');
    const funnel = await createFunnel(id, name || id);
    res.json(funnel);
  } catch (err) {
    res.status(500).json({ error: 'create_funnel_failed' });
  }
});

app.post('/api/admin/funnels/:id/steps', requireApiKey, async (req, res) => {
  const { stepId, name } = req.body || {};
  if (!stepId) return res.status(400).json({ error: 'stepId_required' });
  try {
    const { addFunnelStep } = await import('../../server/funnels.js');
    const step = await addFunnelStep(req.params.id, stepId, name || stepId);
    res.json(step);
  } catch (err) {
    res.status(500).json({ error: 'add_step_failed' });
  }
});

app.get('/api/admin/chats/:chatId/funnel', requireApiKey, async (req, res) => {
  try {
    const { getChatFunnel } = await import('../../server/funnels.js');
    const chat = await getChatFunnel(req.params.chatId);
    res.json(chat || {});
  } catch (err) {
    res.status(500).json({ error: 'get_chat_funnel_failed' });
  }
});

app.post('/api/admin/chats/:chatId/funnel', requireApiKey, async (req, res) => {
  const { funnelId, stepId } = req.body || {};
  if (!funnelId) return res.status(400).json({ error: 'funnelId_required' });
  try {
    const { setChatFunnel } = await import('../../server/funnels.js');
    const chat = await setChatFunnel(req.params.chatId, funnelId, stepId || null);
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'set_chat_funnel_failed' });
  }
});

app.get('/api/admin/chats/:chatId/status', requireApiKey, async (req, res) => {
  try {
    const { getChatStatus } = await import('../../server/status.js');
    const status = await getChatStatus(req.params.chatId);
    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: 'get_status_failed' });
  }
});

app.post('/api/admin/chats/:chatId/status', requireApiKey, async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'status_required' });
  try {
    const { setChatStatus } = await import('../../server/status.js');
    const chat = await setChatStatus(req.params.chatId, status);
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'set_status_failed' });
  }
});app.post('/api/poc/create-appointment', (req, res) => {
  const { clientId, professionalId, serviceId, start, end } = req.body;
  if (!professionalId || !start || !end) return res.status(400).json({ error: 'professionalId, start and end required' });
  const id = `a_${Date.now()}`;
  const appt = { id, clientId: clientId || null, professionalId, serviceId, start, end, status: 'CONFIRMED', createdAt: new Date().toISOString() };
  appointments.push(appt);
  res.json(appt);
});

// Clients management endpoints (CRUD)
import { listClients, getClientById, createClient, updateClient, deleteClient } from '../../server/models/clients.js';
import axios from 'axios';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';
function requireApiKey(req,res,next){
  const k = req.headers['x-api-key'];
  if (k !== ADMIN_API_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.get('/api/clients', requireApiKey, (req,res)=> {
  res.json(listClients());
});
app.get('/api/clients/:id', requireApiKey, (req,res)=> {
  const c = getClientById(req.params.id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  res.json(c);
});
app.post('/api/clients', requireApiKey, async (req,res)=>{
  const { name, provider, creds, phoneNumberId } = req.body;
  if (!name || !provider) return res.status(400).json({ error: 'name and provider required' });
  const c = await createClient({ name, provider, creds, phoneNumberId });
  res.json(c);
});
app.put('/api/clients/:id', requireApiKey, async (req,res)=>{
  const updated = await updateClient(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json(updated);
});
app.delete('/api/clients/:id', requireApiKey, async (req,res)=>{
  await deleteClient(req.params.id);
  res.json({ ok: true });
});
// test connection
app.post('/api/clients/:id/test', requireApiKey, async (req,res)=>{
  const c = getClientById(req.params.id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  if (c.provider === 'avisa') {
    const apiKey = (c.creds && c.creds.apiKey) || '';
    const phoneNumberId = c.phoneNumberId;
    if (!apiKey || !phoneNumberId) return res.status(400).json({ error: 'missing_creds' });
    try {
      await axios.post('https://www.avisaapi.com.br/api/actions/sendMessage', { number: '00000000000', message: 'test' }, { headers: { 'Authorization': apiKey, 'Content-Type':'application/json' }});
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.response?.data || err.message });
    }
    return;
  }
  res.json({ ok: true, provider: c.provider });
});

if (!process.env.SKIP_WHATSAPP) {
  client.initialize();
  client.on('ready', async () => {
    console.log('WhatsApp client ready!');
    try {
      const { startPeriodicCleanup } = await import('../../server/pendingCleaner.js');
      // notifier uses client.sendMessage
      const notifier = async (chatId, text) => {
        try {
          await client.sendMessage(chatId, text);
        } catch (err) {
          console.error('Failed to send expiration notification to', chatId, err);
        }
      };
      startPeriodicCleanup(parseInt(process.env.PENDING_CLEANUP_INTERVAL || '60', 10), notifier);
    } catch (err) {
      console.error('Failed to start pending cleaner:', err);
    }
  });
} else {
  console.log('SKIP_WHATSAPP set; not initializing WhatsApp client (use only API endpoints).');
}

const PORT = process.env.WHATSAPP_PORT || 3333;
if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`WhatsApp connector running at http://localhost:${PORT}`));
}

export default app;
