FROM node:24-alpine AS dependencies
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/api-contract/package.json packages/api-contract/package.json
COPY packages/design-tokens/package.json packages/design-tokens/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
ARG NEXT_PUBLIC_API_MODE=remote
ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ARG EDUCHAIN_SERVER_URL=http://server:8080
ARG EDUCHAIN_DEPLOYMENT_ENV=integration
ENV NEXT_PUBLIC_API_MODE=$NEXT_PUBLIC_API_MODE \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    EDUCHAIN_SERVER_URL=$EDUCHAIN_SERVER_URL \
    EDUCHAIN_DEPLOYMENT_ENV=$EDUCHAIN_DEPLOYMENT_ENV \
    NEXT_TELEMETRY_DISABLED=1
COPY apps/web apps/web
COPY packages packages
RUN pnpm --filter @educhain/api-contract generate
RUN pnpm --filter @educhain/web build
RUN if [ "$NEXT_PUBLIC_API_MODE" != "mock" ]; then rm -f apps/web/public/mockServiceWorker.js; fi

FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup --system --gid 1001 educhain && \
    adduser --system --uid 1001 --ingroup educhain educhain
COPY --from=build --chown=educhain:educhain /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=educhain:educhain /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=educhain:educhain /workspace/apps/web/public ./apps/web/public
USER educhain
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
