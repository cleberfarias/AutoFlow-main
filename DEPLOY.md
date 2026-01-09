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

Se quiser, posso fazer um commit final com uma branch e abrir um PR contendo:
- `Dockerfile` (adicionado)
- `.github/workflows/render-deploy.yml` (adicionado)
- `DEPLOY.md` (documentação)

Quer que eu faça o commit + push para criar um PR? (recomendado)