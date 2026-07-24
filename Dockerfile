# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV DATABASE_URL=postgres://payload:payload@127.0.0.1:5432/payload
ENV PAYLOAD_SECRET=container-build-only-secret
ENV R2_ACCESS_KEY_ID=build-access-key
ENV R2_BUCKET=build-media
ENV R2_ENDPOINT=https://example.r2.cloudflarestorage.com
ENV R2_PUBLIC_URL=https://media.example.com
ENV R2_SECRET_ACCESS_KEY=build-secret-key
ENV SITE_URL=https://example.com
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public && pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 payload \
  && useradd --system --uid 1001 --gid payload payload
COPY --from=dependencies --chown=payload:payload /app/node_modules ./node_modules
COPY --from=builder --chown=payload:payload /app/.next/standalone ./
COPY --from=builder --chown=payload:payload /app/.next/static ./.next/static
COPY --from=builder --chown=payload:payload /app/public ./public
COPY --from=builder --chown=payload:payload /app/src ./src
COPY --from=builder --chown=payload:payload /app/package.json ./package.json
COPY --from=builder --chown=payload:payload /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=payload:payload /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=payload:payload /app/tsconfig.json ./tsconfig.json
USER payload
EXPOSE 3000
CMD ["node", "server.js"]
