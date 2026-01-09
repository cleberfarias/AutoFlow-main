import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import OpenAI from 'openai';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Determine base for GitHub Pages project or default to '/'
    // If running on GitHub Actions, GITHUB_REPOSITORY will be like "owner/repo"
    // so we use the repo name as base: '/repo/'
    const githubRepo = process.env.GITHUB_REPOSITORY || '';
    const base = githubRepo ? `/${githubRepo.split('/')[1]}/` : '/';

    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // Dev middleware to proxy /api/generate to OpenAI when running vite dev
        {
          name: 'dev-server-api',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              console.debug('dev middleware incoming', req.url, req.method);
              try {
                // /api/generate
                if (req.url === '/api/generate' && req.method?.toUpperCase() === 'POST') {
                  let body = '';
                  for await (const chunk of req) body += chunk;
                  const json = JSON.parse(body || '{}');
                  const prompt = json.prompt;
                  if (!prompt) return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'prompt required' }));
                  const apiKey = process.env.OPENAI_API_KEY;
                  if (!apiKey) return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Missing OPENAI_API_KEY on server' }));

                  const openai = new OpenAI({ apiKey });
                  const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    response_format: { type: 'json_object' },
                    messages: [
                      { role: 'system', content: `Você é um Consultor Sênior de Crescimento para PMEs brasileiros.\n\nSua tarefa é desenhar o fluxo de trabalho ideal focado em LUCRO e ECONOMIA DE TEMPO.\nUse termos de NEGÓCIO claros.\n\nESTRUTURA DOS NÓS:\n1. TRIGGER: O que inicia o processo (ex: "Recebeu Mensagem", "Novo Pedido").\n2. ACTION: Uma tarefa realizada (ex: "Calcular Desconto", "Enviar Notificação").\n3. DATA: Armazenar ou buscar info (ex: "Salvar na Planilha Financeira", "Consultar Estoque").\n4. LOGIC: Uma decisão (ex: "Cliente é VIP?", "Valor acima de R$100?").\n\nREGRAS:\n- 'inputs' e 'outputs' devem ter nomes legíveis por humanos (ex: ["valor_total", "data_entrega"]).\n- 'nextSteps' deve conectar os IDs corretamente para formar um fluxo lógico.\nResponda SOMENTE com JSON no formato { "steps": [...] }.` },
                      { role: 'user', content: `Pedido do cliente: "${prompt}"` }
                    ]
                  });

                  const content = response.choices?.[0]?.message?.content || '';
                  const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                  const parsed = match ? JSON.parse(match[0]) : null;
                  const steps = Array.isArray(parsed) ? parsed : parsed?.steps || [];
                  res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ steps }));
                  return;
                }

                // /api/simulate
                if (req.url === '/api/simulate' && req.method?.toUpperCase() === 'POST') {
                  let body = '';
                  for await (const chunk of req) body += chunk;
                  const json = JSON.parse(body || '{}');
                  const prompt = json.userMessage || 'Inicie a simulação.';
                  const steps = json.steps || [];
                  const apiKey = process.env.OPENAI_API_KEY;
                  if (!apiKey) return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Missing OPENAI_API_KEY on server' }));

                  const openaiSim = new OpenAI({ apiKey });
                  const system = `Você é o motor de execução AutoFlow. Seu objetivo é SIMULAR uma conversa real entre a automação e o cliente final.\n\nFLUXO ATUAL: ${JSON.stringify(steps || [])}\n\nResponda SOMENTE com JSON no formato {"userMessage":"...","actionName":"...","actionDescription":"...","stepId":"...","newVariables":{}} (a resposta deve conter a palavra "json" se for necessário).`;

                  const resp = await openaiSim.chat.completions.create({
                    model: 'gpt-4o-mini',
                    response_format: { type: 'json_object' },
                    messages: [ { role: 'system', content: system }, { role: 'user', content: prompt } ]
                  });

                  const content = resp.choices?.[0]?.message?.content || '';
                  // try to extract JSON safety and fallback to raw message when needed
                  const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                  if (!match) {
                    console.warn('dev /api/simulate: no JSON found in model response; returning raw content as userMessage', content);
                    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ result: { userMessage: String(content || '').trim(), stepId: null } }));
                  }
                  try {
                    const parsed = JSON.parse(match[0]);
                    const result = parsed || {};
                    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ result }));
                  } catch (err: any) {
                    console.error('dev /api/simulate: failed to parse JSON', content, err);
                    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ result: { userMessage: String(content || '').trim(), stepId: null } }));
                  }
                  return;
                }

                // not handled => pass to next
                return next();
              } catch (err: any) {
                console.error('dev /api/proxy error', err);
                res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'proxy_failed', message: err?.message || String(err) }));
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
