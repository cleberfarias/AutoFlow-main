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