# ── Stage 1: Build ──────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src/ ./src/

RUN npx tsc

# ── Stage 2: Run ───────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Cloud Run requires listening on PORT env var (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
