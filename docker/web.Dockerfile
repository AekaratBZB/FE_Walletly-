# syntax=docker/dockerfile:1
# build context = root ของ FE repo (ดู docker/docker-compose.yml)

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# เรียก API ผ่าน nginx ใน container เดียวกัน (same origin) ไม่ใช้ URL ของ Cloud Run จาก .env.production
ENV VITE_API_URL=/api
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
