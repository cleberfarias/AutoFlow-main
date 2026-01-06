

# AutoFlow AI - Enterprise Edition

Plataforma visual para criar, organizar e simular automacoes de atendimento e vendas para PMEs, com geracao de fluxos por IA e edicao visual por blocos.

## Para que serve o projeto

Criar fluxos de atendimento e vendas de forma rapida, visual e testavel, reduzindo tempo de operacao e padronizando processos para pequenas e medias empresas.

## Autor

Cleber Delgado

## Funcionalidades

- Cadastro de clientes e organizacao de automacoes por cliente.
- Criacao de fluxos por prompt (IA) com blocos de TRIGGER, ACTION, DATA, LOGIC e ERROR_HANDLER.
- Edicao visual dos nos com drag and drop, zoom, pan e ajuste de enquadramento.
- Editor de configuracao de cada no (titulo, descricao e parametros).
- Simulador de runtime com chat e destaque do passo ativo.
- Modo Preview e exportação de fluxo (PNG) para apresentações.
- Captura de voz para transcricao e disparo de prompts.
- Persistencia local via LocalStorage.

## Paleta de cores

- Primaria: azul #3b82f6 (destaques, botoes e estados ativos).
- Neutras: familia slate (fundos, textos e bordas).
- Acentos por tipo de no:
  - TRIGGER: verde-emerald.
  - ACTION: azul.
  - DATA: indigo.
  - LOGIC: amber.
  - ERROR_HANDLER: rose.
- Superficie escura do simulador: slate-900 com detalhes em azul.

## Licencas

- Projeto (codigo): MIT - https://opensource.org/licenses/MIT
- Ideia e conceito: Creative Commons Attribution 4.0 International (CC BY 4.0) - https://creativecommons.org/licenses/by/4.0/

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Do NOT set any OpenAI/Gemini API key in frontend env (e.g., no `VITE_*` keys that contain secrets). Configure OpenAI on the server only as `OPENAI_API_KEY`.
3. Environment variables (server-side):
   - `OPENAI_API_KEY` (optional, for server LLM operations)
   - `CHATGURU_BASE_URL` (optional, e.g., `https://chatguru.yourdomain`) — if not set, the app uses same-origin and the /api/autoflow/apply will act as a stub in development.
   - `CHATGURU_API_KEY` (optional) — used as Bearer when forwarding to ChatGuru.
   - `CHATGURU_MAX_RETRIES` (optional) — number of attempts to forward (default: 3).
   - `CHATGURU_RETRY_BASE_MS` (optional) — base delay (ms) for backoff (default: 300).

4. Run the app:
   `npm run dev`
5. (Opcional) Execute os testes:
   `npm test`

## Connectors (POC)

- Há um conector POC para WhatsApp via WhatsApp Web em `connectors/whatsapp` com endpoints para enviar mensagens e endpoints POC de `find-availability` / `create-appointment`.
- Para rodar o conector:
  `npm run whatsapp:start`

**Atenção:** use apenas para POC com número de teste — para produção, prefira integrações oficiais (Twilio / WhatsApp Cloud API).
