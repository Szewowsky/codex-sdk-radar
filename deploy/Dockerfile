FROM node:22-slim

# Bez klucza OpenAI API: silnik Codexa loguje się kontem ChatGPT, sesja leży w wolumenie /codex-home.
ENV NODE_ENV=production PORT=3000 CODEX_HOME=/codex-home
WORKDIR /app

# git + certyfikaty dla silnika Codexa. Bez Pythona i pobieraczy wideo: dane pobiera appka przez RSS,
# YouTube Data API i Apify.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Ta sama wersja @openai/codex-sdk co na laptopie (package-lock.json z repo).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Nazwy plików appki z przebiegu autora. Agent dopasowuje listę COPY do plików swojej appki
# (np. inny podział na moduły albo katalog src/).
COPY server.js report.js device-login.js process-group.js ./
COPY public/ ./public/
COPY docs/schema.json ./docs/schema.json

# Kontener nie działa jako root: użytkownika ustawia `user:` w docker-compose.yml
# (UID:GID właściciela ./data i ./codex-home na serwerze), więc tu nie ma USER.
EXPOSE 3000
CMD ["node", "server.js"]
