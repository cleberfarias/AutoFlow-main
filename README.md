<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AutoFlow AI - Enterprise Edition

Plataforma visual para criar, organizar e simular automacoes de atendimento e vendas para PMEs, com geracao de fluxos por IA e edicao visual por blocos.

View your app in AI Studio: https://ai.studio/apps/drive/1ojo5enW6FJHLycGiMXuW8WfIwOcnzJ1C

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
4. (Opcional) Execute os testes:
   `npm test`

## Connectors (POC)

- Há um conector POC para WhatsApp via WhatsApp Web em `connectors/whatsapp` com endpoints para enviar mensagens e endpoints POC de `find-availability` / `create-appointment`.
- Para rodar o conector:
  `npm run whatsapp:start`

**Atenção:** use apenas para POC com número de teste — para produção, prefira integrações oficiais (Twilio / WhatsApp Cloud API).
