

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

### Configuração Inicial

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o ambiente:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edite `.env.local` e configure:
   - `OPENAI_API_KEY`: Sua chave da OpenAI (obtenha em https://platform.openai.com/api-keys)
   - **IMPORTANTE**: A chave NUNCA é exposta no frontend - apenas o servidor a utiliza

### Executando a Aplicação

#### Opção 1: Desenvolvimento completo (recomendado)
Execute frontend + backend juntos:
```bash
npm run dev:full
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5050

#### Opção 2: Separado
Terminal 1 (backend):
```bash
npm run server
```

Terminal 2 (frontend):
```bash
npm run dev
```

### Modo de Desenvolvimento SEM Chave (Mock)

Para testar a UI sem gastar tokens da OpenAI:

1. NÃO configure `OPENAI_API_KEY` no `.env.local` (ou deixe vazio)
2. Execute: `npm run dev:full`
3. O backend retornará respostas mock automaticamente
4. Ideal para testar fluxo da aplicação sem custo

### Testes

Execute os testes:
```bash
npm test
```

### Arquitetura de Segurança

✅ **Seguro**: Chave da OpenAI apenas no servidor  
❌ **Removido**: Acesso direto à OpenAI do frontend  
🔒 **Proxy**: Frontend chama `/api/generate` → Backend valida → OpenAI

## Connectors (POC)

- Há um conector POC para WhatsApp via WhatsApp Web em `connectors/whatsapp` com endpoints para enviar mensagens e endpoints POC de `find-availability` / `create-appointment`.
- Para rodar o conector:
  `npm run whatsapp:start`

**Atenção:** use apenas para POC com número de teste — para produção, prefira integrações oficiais (Twilio / WhatsApp Cloud API).
