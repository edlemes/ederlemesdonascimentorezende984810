#!/bin/sh
# Health check script for Docker container
# Verifica tanto o Liveness (app local) quanto o Readiness (API)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Função de log
log_error() {
    echo "${RED}ERROR: $1${NC}" >&2
}

log_success() {
    echo "${GREEN}SUCCESS: $1${NC}"
}

# 1. Liveness Check: Verifica se o Nginx está respondendo
check_liveness() {
    if curl -f -s http://localhost/health.html > /dev/null 2>&1; then
        log_success "Liveness check OK - Nginx responding"
        return 0
    else
        log_error "Liveness check FAILED - Nginx not responding"
        return 1
    fi
}

# 2. Readiness Check: Verifica se a API está acessível
check_readiness() {
    API_URL="${VITE_API_URL:-https://pet-manager-api.geia.vip}"
    if curl -f -s "${API_URL}/q/health" > /dev/null 2>&1; then
        log_success "Readiness check OK - API is accessible"
        return 0
    else
        log_error "Readiness check FAILED - API not accessible"
        return 1
    fi
}

# Executa os checks
LIVENESS_OK=0
READINESS_OK=0

if ! check_liveness; then
    LIVENESS_OK=1
fi

if ! check_readiness; then
    READINESS_OK=1
    # Readiness não deve falhar o health check durante o start period
    # mas logamos para debug
    echo "Warning: API not ready yet (this is OK during startup)"
fi

# Retorna erro apenas se o Liveness falhar
# Readiness é opcional para não impedir o container de iniciar
if [ $LIVENESS_OK -ne 0 ]; then
    exit 1
fi

exit 0
