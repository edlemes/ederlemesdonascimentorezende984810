FROM node:20-alpine3.19 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_AUTH_USERNAME
ARG VITE_AUTH_PASSWORD

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AUTH_USERNAME=${VITE_AUTH_USERNAME}
ENV VITE_AUTH_PASSWORD=${VITE_AUTH_PASSWORD}

RUN npm run build

FROM nginx:1.25-alpine-slim

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health.html || exit 1

CMD ["nginx", "-g", "daemon off;"]