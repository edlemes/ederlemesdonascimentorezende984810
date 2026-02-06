FROM node:20-alpine3.19 AS build

LABEL org.opencontainers.image.title="Pata Digital SPA - Build Stage"

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production=false && \
    npm cache clean --force

COPY . .

ARG VITE_API_URL
ARG VITE_AUTH_USERNAME
ARG VITE_AUTH_PASSWORD

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AUTH_USERNAME=${VITE_AUTH_USERNAME}
ENV VITE_AUTH_PASSWORD=${VITE_AUTH_PASSWORD}

RUN npm run build

FROM nginx:1.25-alpine-slim AS production

LABEL org.opencontainers.image.title="Pata Digital SPA"
LABEL org.opencontainers.image.description="Sistema de Gerenciamento de Pets e Tutores - Edital 001/2026"
LABEL org.opencontainers.image.vendor="Seplag MT"
LABEL org.opencontainers.image.version="1.0.0"

RUN apk add --no-cache curl && \
    rm -rf /usr/share/nginx/html/* && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY scripts/docker-healthcheck.sh /usr/local/bin/healthcheck.sh

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod +x /usr/local/bin/healthcheck.sh

EXPOSE 80

STOPSIGNAL SIGQUIT

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh || exit 1

CMD ["nginx", "-g", "daemon off;"]