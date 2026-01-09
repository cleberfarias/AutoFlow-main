

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
2. Set the `VITE_OPENAI_API_KEY` in [.env.local](.env.local) to your OpenAI API key
3. Run the app:
   `npm run dev`

Dev options for OpenAI usage:
- Quick test (dev-only): set `OPENAI_API_KEY` as an **environment variable** and Vite will proxy `/api/generate` to OpenAI automatically (no extra server required):

  ```bash
  OPENAI_API_KEY=sk-... npm run dev
  ```

- Production / safer approach: run the server process which exposes `/api/generate` and uses `OPENAI_API_KEY` from the server env (recommended for not exposing keys to the browser):

  ```bash
  OPENAI_API_KEY=sk-... npm run server
  # then open http://localhost:3002 and the frontend will call /api/generate
  ```

4. (Opcional) Execute os testes:
   `npm test`

## Connectors (POC)

- Há um conector POC para WhatsApp via WhatsApp Web em `connectors/whatsapp` com endpoints para enviar mensagens e endpoints POC de `find-availability` / `create-appointment`.
- Para rodar o conector:
  `npm run whatsapp:start`

**Atenção:** use apenas para POC com número de teste — para produção, prefira integrações oficiais (Twilio / WhatsApp Cloud API).
