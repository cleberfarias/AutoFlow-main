# Dockerfile para rodar frontend (Vite build) + backend WhatsApp (whatsapp-web.js com Chromium)

FROM node:18-bullseye-slim AS build

# Instalar dependências de sistema necessárias para build
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  git \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .

# Build do frontend (Vite)
RUN npm run build

# --- Runtime image ---
FROM node:18-bullseye-slim

# Instalar Chromium e dependências necessárias para puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  fonts-liberation \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libxss1 \
  libasound2 \
  libgbm1 \
  libcups2 \
  libxshmfence1 \
  libgtk-3-0 \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy node modules from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/connectors ./connectors
COPY --from=build /usr/src/app/services ./services
COPY --from=build /usr/src/app/components ./components
COPY --from=build /usr/src/app/*.js ./
COPY --from=build /usr/src/app/*.ts ./

# Create directory for whatsapp session persistence
RUN mkdir -p /data/whatsapp && chown -R node:node /data/whatsapp

ENV NODE_ENV=production
# Puppeteer default executable if present in image
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Prevent puppeteer from downloading its own Chromium during npm install in build stage
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Set default port used by the whatsapp connector
ENV WHATSAPP_PORT=3333

USER node

EXPOSE ${WHATSAPP_PORT}

# Start the WhatsApp server (serves static files from /dist and runs the whatsapp connector)
CMD ["node", "connectors/whatsapp/server.js"]
