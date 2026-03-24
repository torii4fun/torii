# Warps — Clan Trading Platform

Клановая платформа на Solana. Пользователи соревнуются кланами за призовой пул по реальному PnL кошельков.

---

## Быстрый старт (локально)

### 1. Установи зависимости
```bash
npm install
```

### 2. Настрой переменные окружения
```bash
cp .env.example .env
# Заполни .env своими ключами
```

### 3. Подними PostgreSQL через Docker
```bash
docker-compose up -d
# База warps поднимется на localhost:5432
```

### 4. Накати схему БД
```bash
npm run db:migrate
```

### 5. Запусти проект
```bash
npm run dev
# Frontend → http://localhost:3000
# Backend  → http://localhost:4000
```

---

## Helius RPC (рекомендуется)

Публичный Solana RPC имеет жёсткие rate limits. Зарегистрируйся на [helius.dev](https://dev.helius.xyz) (бесплатно, 100k запросов/день) и вставь URL в `.env`:

```
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

---

## Деплой на Railway

1. Залей на GitHub
2. Railway → New Project → Deploy from GitHub repo
3. Добавь все переменные из `.env` в Railway Variables
4. В Railway Terminal выполни: `npm run db:migrate`
5. Приложение доступно на `https://your-app.railway.app`

---

## Команды

| Команда | Описание |
|---|---|
| `npm run dev` | Запуск локально (фронт :3000, бэк :4000) |
| `npm run build` | Сборка фронта в dist/ |
| `npm run db:migrate` | Применить схему БД |
| `docker-compose up -d` | Поднять PostgreSQL локально |
| `docker-compose down` | Остановить PostgreSQL |
