# === Этап 1: Python dependencies ===
FROM python:3.13.1-slim AS python-base

WORKDIR /app/ml

COPY ml/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ml/ .

# === Этап 2: Node + Python ===
FROM node:22.1.0

# Установка системных зависимостей для playwright
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    ca-certificates \
    libnss3 \
    libxss1 \
    libasound2 \
    libxshmfence-dev \
    libgbm-dev \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libxrandr2 \
    xdg-utils \
    fonts-liberation \
    libappindicator1 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

WORKDIR /app/extractor
RUN npm install -g pnpm && pnpm install && pnpm playwright install --with-deps

COPY --from=python-base /usr/local /usr/local

WORKDIR /app
EXPOSE 5500 5550

CMD ["sh", "-c", "pnpm --prefix extractor dev & python3 ml/server.py && wait"]
