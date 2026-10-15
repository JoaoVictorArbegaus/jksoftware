# Etapa 1: instala, faz o typecheck, o build e a pré-renderização (dist/)
FROM node:24.13.0-alpine3.22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Etapa 2: só o HTML estático servido pelo nginx, sem Node
FROM nginx:1.29.1-alpine AS site
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q --spider http://127.0.0.1/ || exit 1
