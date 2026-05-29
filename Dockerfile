FROM node:20-slim

# ── System deps ───────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ── yt-dlp (nightly for latest extractor fixes) ───────────────────────────────
RUN pip3 install --break-system-packages \
    "yt-dlp @ https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp.tar.gz"

# ── Deno (JS runtime for yt-dlp signature solving) ────────────────────────────
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

# ── App ───────────────────────────────────────────────────────────────────────
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Copy static assets next to the standalone server
RUN mkdir -p .next/standalone/public \
    && cp -r .next/static .next/standalone/.next/static

# ── Runtime ───────────────────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
# PORT is injected by Render (default 3000 for local use)
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
