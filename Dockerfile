# ==========================================
# STAGE 1: Install Dependencies
# ==========================================
FROM node:20-alpine AS deps
# libc6-compat sangat direkomendasikan untuk Alpine Linux agar build tools Node.js berjalan lancar
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ==========================================
# STAGE 2: Build Project
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Matikan telemetry Next.js agar build lebih cepat
ENV NEXT_TELEMETRY_DISABLED 1

# Lakukan build
RUN pnpm build

# ==========================================
# STAGE 3: Production Runner (Image Final)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Buat user non-root untuk keamanan server
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set folder public jika ada gambar/aset statis
COPY --from=builder /app/public ./public

# KUNCI OPTIMASI: Hanya salin folder standalone (ukuran sangat kecil)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Gunakan user non-root
USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Jalankan server.js bawaan dari standalone build, bukan pnpm start
CMD ["node", "server.js"]