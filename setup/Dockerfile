FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY shared/package*.json shared/
RUN cd shared && npm ci
COPY setup/package*.json setup/
RUN cd setup && npm ci            # dev deps included: this is where tsx comes from

COPY shared shared                
COPY setup setup

ENV NODE_ENV=production OPEN_BROWSER=false
WORKDIR /app/setup
EXPOSE 4000
# Run TS directly with tsx. Direct binary path because npx needs a writable home dir.
CMD ["./node_modules/.bin/tsx", "src/app/server.ts"]