# Deploy the frontend on its own. The browser calls /api on this host.
#   docker build -t rhythm-web ./frontend
#   docker run -p 5174:5174 -e API_UPSTREAM=https://rhythm-api-965239735739.europe-west1.run.app rhythm-web
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.27-alpine

ENV API_UPSTREAM=https://rhythm-api-965239735739.europe-west1.run.app

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5174

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5174/ >/dev/null || exit 1
