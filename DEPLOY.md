Deploy rápido para Render

Passos essenciais:

1) Criar serviço no Render
   - Tipo: "Web Service"
   - Ambiente: Docker (Render vai usar o Dockerfile no repo)
   - Branch: `main` (ou a branch que preferir)
   - Configure um "Persistent Disk" e monte-o em `/data` para persistir a sessão do WhatsApp (importante)

2) Segredos no GitHub (Repository > Settings > Secrets):
   - `RENDER_SERVICE_ID` → ID do serviço no Render (UUID)
   - `RENDER_API_KEY` → API key do Render (com permissão para deploys)
   - (Opcional) `GHCR_PAT` se preferir usar um token pessoal para GHCR; o workflow usa `GITHUB_TOKEN` por padrão
4) Segredos necessários para integração local / CI (CI valida sua presença):
   - `OPENAI_API_KEY` → chave da OpenAI para endpoints de geração e embeddings
   - `CHATGURU_BASE_URL` → base URL do endpoint ChatGuru (ex: `https://chatguru.example`)
   - `CHATGURU_API_KEY` → key para autenticação com ChatGuru
   - `WHATSAPP_SESSION_DIR` → diretório onde a sessão do WhatsApp será persistida no runner (ex: `/data/whatsapp`)

> Observação: O workflow `.github/workflows/validate-env.yml` falhará em ambientes de integração (push para `main`) quando algum secret obrigatório estiver faltando. Em pull requests vindo de forks, por razões de segurança, os secrets do repositório não são disponibilizados — o workflow apenas reportará que os checks foram pulados para esses PRs.

4) Observações importantes
   - O container instala Chromium e expõe a porta `3333` (padrão). Ajuste `WHATSAPP_PORT` se necessário.
   - A sessão do WhatsApp é salva em `/data/whatsapp`. Garanta que o volume/persistent disk esteja disponível nesse caminho.
   - O servidor serve tanto o frontend (conteúdo em `/dist`) quanto os endpoints do WhatsApp (ex.: `/send`, `/api/poc/*`).
3) Observações importantes
   - O container instala Chromium e expõe a porta `3333` (padrão). Ajuste `WHATSAPP_PORT` se necessário.
   - A sessão do WhatsApp é salva em `/data/whatsapp`. Garanta que o volume/persistent disk esteja disponível nesse caminho.
   - O servidor serve tanto o frontend (conteúdo em `/dist`) quanto os endpoints do WhatsApp (ex.: `/send`, `/api/poc/*`).

4) Testes locais
   - `docker build -t local/autoflow:dev .`
   - `docker run -p 3333:3333 -v $(pwd)/.local-whatsapp:/data/whatsapp local/autoflow:dev`

---

## Postgres e Migração de dados

Recomendo usar Postgres para produção e testes de integração. Abaixo estão os passos rápidos para configurar e rodar a migração localmente e no CI:

- Variável de ambiente requerida:
  - `DATABASE_URL` (ex: `postgres://postgres:postgres@localhost:5432/autoflow`)

- Gerar client e aplicar schema (local/dev):
  - `npx prisma generate --schema=prisma/schema.prisma`
  - `npx prisma db push --schema=prisma/schema.prisma`

- Migrar dados existentes de `data/db.json` para o banco:
  - `npm run migrate:prisma:postgres` (este script importa `pendingConfirmations` e `storage` para Postgres via Prisma)

- Rollback (reverte as entradas migradas a partir de `data/db.json`):
  - `npm run rollback:migrate:postgres`

> Observação: Na CI, já adicionamos um workflow (`.github/workflows/postgres-integration.yml`) que inicializa um serviço Postgres, aplica o schema e executa `npm run migrate:prisma:postgres` antes de rodar os testes.

---

Se quiser, posso abrir PR com mudanças extras (ex.: adicionar migration logs, checks e um job de migração segura).