FROM node:20-alpine

WORKDIR /app

# Copy shared-types first (workspace dependency)
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/tsconfig.json packages/shared-types/
COPY packages/shared-types/src/ packages/shared-types/src/

# Copy backend
COPY backend/package.json backend/
COPY backend/tsconfig.json backend/

# Copy root workspace config
COPY package.json pnpm-workspace.yaml ./

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile --filter @pr-outreach/backend --filter @pr-outreach/shared-types

# Build shared-types then backend
COPY packages/shared-types/ packages/shared-types/
RUN pnpm --filter @pr-outreach/shared-types build

COPY backend/ backend/
RUN pnpm --filter @pr-outreach/backend build
RUN cp backend/src/config/schema.sql backend/dist/config/schema.sql

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/server.js"]
