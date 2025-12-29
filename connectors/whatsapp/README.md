# AutoFlow — WhatsApp POC Connector

Rápido POC para conectar o AutoFlow a um número WhatsApp via WhatsApp Web (whatsapp-web.js).

Como usar
1. Instale dependências na raiz do repositório (se ainda não):
   npm install whatsapp-web.js qrcode-terminal express

2. Inicie o conector:
   npm run whatsapp:start

3. No terminal aparecerá um QR (pequeno). Abra o WhatsApp no celular → Configurações → Dispositivos vinculados → Vincular dispositivo → escaneie o QR.

4. Envie `agendar` para testar busca de disponibilidade; envie `confirmar` para confirmar a vaga (POC).

Endpoints úteis (POC)
- POST /send { to, text } — envia uma mensagem via WhatsApp (formato `5511999999999@c.us`).
- POST /api/poc/find-availability { professionalId, serviceId, fromISO } — retorna `suggestedStart`/`suggestedEnd`.
- POST /api/poc/create-appointment { professionalId, start, end } — cria appointment POC.

Atenção
- Use apenas para POC e evite envios massivos (risco de bloqueio). Para produção, prefira APIs oficiais (Twilio / WhatsApp Cloud API).