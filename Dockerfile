# Deploy the frontend on its own. Vite bakes VITE_API_BASE_URL in at build time.
#   docker build -t rhythm-web --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 ./frontend
#   docker run -p 5174:5174 rhythm-web
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:3002/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5174

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5174/ >/dev/null || exit 1
