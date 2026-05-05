FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=https://api.openstaff.eu
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
