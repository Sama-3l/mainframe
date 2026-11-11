# ---------- build stage ----------
FROM node:22-bookworm-slim AS build
# Compiler toolchain, only used if better-sqlite3 has no prebuilt binary for your platform
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Manifests first, so `npm ci` stays cached until dependencies change
COPY shared/package*.json shared/
RUN cd shared && npm ci
COPY api/package*.json api/
RUN cd api && npm ci

# Then the source, then build Next.js
COPY shared shared
COPY api api
WORKDIR /app/api
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
# HOSTNAME=0.0.0.0 matters: otherwise Next only listens on localhost inside the
# container and the tunnel (a different container) can't reach it.
WORKDIR /app
COPY --from=build /app .
# Next writes a runtime cache; it must be writable by the UID compose runs as
RUN mkdir -p api/.next/cache && chmod -R a+rwX api/.next
WORKDIR /app/api
EXPOSE 3000
CMD ["npm", "run", "start"]