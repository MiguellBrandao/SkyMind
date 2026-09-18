FROM node:20-slim AS base
WORKDIR /app
COPY package.json package-lock.json* ./

FROM base AS deps
RUN npm install

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# curl is used by the knowledge-ingestion fetcher (not Node's native fetch) - some wiki hosts
# fingerprint and block Node's TLS/HTTP client at the edge (Cloudflare) even with browser-like
# headers, while curl passes through fine.
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
