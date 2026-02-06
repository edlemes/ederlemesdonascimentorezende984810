#!/bin/bash

set -e

TARGET="${1:-local}"
HOST="${2:-localhost}"
PORT="${3:-5173}"
TIMEOUT="${4:-5}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

write_status() {
    local message=$1
    local status=$2
    
    case $status in
        "OK")
            echo -e "${GREEN}[OK]${NC} $message"
            ;;
        "FAIL")
            echo -e "${RED}[FAIL]${NC} $message"
            ;;
        "INFO")
            echo -e "${CYAN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

test_endpoint() {
    local url=$1
    local name=$2
    
    write_status "Testando $name..." "INFO"
    
    start_time=$(date +%s%3N)
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>&1); then
        end_time=$(date +%s%3N)
        elapsed=$((end_time - start_time))
        
        if [ "$response" = "200" ]; then
            write_status "$name OK (${elapsed}ms)" "OK"
            return 0
        else
            write_status "$name retornou status $response" "WARN"
            return 1
        fi
    else
        end_time=$(date +%s%3N)
        elapsed=$((end_time - start_time))
        write_status "$name FALHOU (${elapsed}ms)" "FAIL"
        return 1
    fi
}

test_liveness() {
    local base_url=$1
    
    echo ""
    echo -e "${CYAN}=== LIVENESS PROBE ===${NC}"
    write_status "Verifica se a aplicação está rodando" "INFO"
    
    if test_endpoint "$base_url/health.html" "Liveness (health.html)"; then
        write_status "✓ Aplicação está VIVA (processo rodando)" "OK"
        return 0
    else
        write_status "✗ Aplicação NÃO RESPONDEU (processo morto?)" "FAIL"
        return 1
    fi
}

test_readiness() {
    local api_url=$1
    
    echo ""
    echo -e "${CYAN}=== READINESS PROBE ===${NC}"
    write_status "Verifica se a API está pronta para aceitar requests" "INFO"
    
    if test_endpoint "$api_url/q/health" "Readiness (API /q/health)"; then
        write_status "✓ API está PRONTA para receber tráfego" "OK"
        return 0
    else
        write_status "✗ API NÃO ESTÁ PRONTA (banco down? auth fail?)" "FAIL"
        return 1
    fi
}

test_health_check() {
    local base_url=$1
    
    echo ""
    echo -e "${CYAN}=== HEALTH CHECK COMPLETO ===${NC}"
    write_status "Verifica saúde geral da aplicação" "INFO"
    
    if test_endpoint "$base_url/" "Root endpoint"; then
        write_status "✓ Frontend está servindo corretamente" "OK"
        return 0
    else
        return 1
    fi
}

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Pata Digital - VALIDAÇÃO DE HEALTH CHECKS             ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"

BASE_URL="http://${HOST}:${PORT}"
API_URL="https://pet-manager-api.geia.vip"

if [ "$TARGET" = "docker" ]; then
    PORT=3000
    BASE_URL="http://${HOST}:${PORT}"
    write_status "Target: Docker Container" "INFO"
else
    write_status "Target: Desenvolvimento Local" "INFO"
fi

write_status "Base URL: $BASE_URL" "INFO"
write_status "API URL: $API_URL" "INFO"
write_status "Timeout: ${TIMEOUT}s" "INFO"

LIVENESS_OK=0
READINESS_OK=0
HEALTH_OK=0

test_liveness "$BASE_URL" && LIVENESS_OK=1
test_readiness "$API_URL" && READINESS_OK=1
test_health_check "$BASE_URL" && HEALTH_OK=1

echo ""
echo -e "${CYAN}=== RESULTADO FINAL ===${NC}"

if [ $LIVENESS_OK -eq 1 ] && [ $READINESS_OK -eq 1 ] && [ $HEALTH_OK -eq 1 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✓ TODOS OS CHECKS PASSARAM                  ║${NC}"
    echo -e "${GREEN}║         Aplicação está SAUDÁVEL e OPERACIONAL            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ✗ ALGUNS CHECKS FALHARAM                    ║${NC}"
    echo -e "${RED}║         Verifique os logs acima para detalhes            ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    
    echo ""
    echo -e "${YELLOW}DIAGNÓSTICO:${NC}"
    [ $LIVENESS_OK -eq 0 ] && echo -e "${RED}  • Liveness FALHOU: Aplicação não está rodando ou não responde${NC}"
    [ $READINESS_OK -eq 0 ] && echo -e "${RED}  • Readiness FALHOU: API externa não está acessível${NC}"
    [ $HEALTH_OK -eq 0 ] && echo -e "${RED}  • Health Check FALHOU: Frontend não está servindo${NC}"
    
    exit 1
fi
