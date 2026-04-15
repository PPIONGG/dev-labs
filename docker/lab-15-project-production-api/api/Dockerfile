# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json .
RUN npm ci --omit=dev

# Stage 2: Production
FROM node:20-alpine

# Security: สร้าง non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy production dependencies จาก stage ก่อนหน้า
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app . .

# ใช้ non-root user
USER app

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
