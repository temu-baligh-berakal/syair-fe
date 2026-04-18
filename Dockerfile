FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
