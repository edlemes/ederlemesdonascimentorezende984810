# Scripts de Validação

## Health Check Scripts

Scripts para validar Liveness e Readiness probes da aplicação.

### PowerShell (Windows)

```powershell
# Validar ambiente local (dev server na porta 5173)
.\scripts\health-check.ps1

# Validar container Docker (porta 3000)
.\scripts\health-check.ps1 -Target docker

# Customizar host e porta
.\scripts\health-check.ps1 -HostName localhost -Port 8080

# Aumentar timeout (útil para conexões lentas)
.\scripts\health-check.ps1 -Timeout 10
```

### Bash (Linux/macOS)

```bash
# Dar permissão de execução
chmod +x scripts/health-check.sh

# Validar ambiente local
./scripts/health-check.sh

# Validar container Docker
./scripts/health-check.sh docker

# Customizar host e porta
./scripts/health-check.sh local localhost 8080

# Com timeout customizado
./scripts/health-check.sh local localhost 5173 10
```

## O que cada probe verifica

### Liveness Probe
- **Endpoint:** `GET http://localhost:5173/health.html`
- **Propósito:** Verifica se o processo da aplicação está rodando
- **Falha indica:** Aplicação travou ou processo morreu (requer restart)

### Readiness Probe
- **Endpoint:** `GET https://pet-manager-api.geia.vip/q/health`
- **Propósito:** Verifica se a API externa está acessível
- **Falha indica:** Aplicação não deve receber tráfego (dependências não prontas)

### Health Check Geral
- **Endpoint:** `GET http://localhost:5173/`
- **Propósito:** Verifica se o frontend está servindo corretamente
- **Falha indica:** Nginx/servidor não está configurado corretamente

## Códigos de Saída

- `0`: Todos os checks passaram (aplicação saudável)
- `1`: Um ou mais checks falharam (requer investigação)

## Uso em CI/CD

```yaml
# GitHub Actions
- name: Health Check
  run: |
    npm run dev &
    sleep 5
    ./scripts/health-check.sh
    
# GitLab CI
health_check:
  script:
    - docker compose up -d
    - sleep 10
    - ./scripts/health-check.sh docker
```

---

## Docker Health Check (docker-healthcheck.sh)

Script integrado ao container Docker para health checks automáticos.

### Funcionamento

O script é executado automaticamente pelo Docker HEALTHCHECK e valida:

1. **Liveness Check**: Verifica se o Nginx está respondendo
   - Endpoint: `http://localhost/health.html`
   - Falha: Container marcado como unhealthy

2. **Readiness Check**: Verifica se a API está acessível
   - Endpoint: `$VITE_API_URL/q/health`
   - Falha: Apenas log (não impede startup)

### Configuração no Dockerfile

```dockerfile
COPY scripts/docker-healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh || exit 1
```

### Parâmetros do Health Check

| Parâmetro       | Valor | Descrição                                    |
|----------------|-------|----------------------------------------------|
| `--interval`   | 30s   | Intervalo entre execuções                   |
| `--timeout`    | 10s   | Tempo máximo de execução                    |
| `--start-period` | 30s | Período de graça durante inicialização     |
| `--retries`    | 3     | Tentativas antes de marcar como unhealthy  |

### Execução Manual

```bash
# Dentro do container
docker exec <container> /usr/local/bin/healthcheck.sh

# Ver output colorido
docker exec -it <container> /usr/local/bin/healthcheck.sh

# Output esperado:
# SUCCESS: Liveness check OK - Nginx responding
# SUCCESS: Readiness check OK - API is accessible
```

### Debugging

```bash
# Ver histórico de health checks
docker inspect --format='{{json .State.Health}}' <container> | jq

# Ver apenas últimos outputs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' <container>

# Testar componentes individualmente
docker exec <container> curl -v http://localhost/health.html
docker exec <container> sh -c 'curl -v "$VITE_API_URL/q/health"'
```

### Comportamento de Falha

- ✅ **Liveness OK + Readiness OK**: Container `healthy`
- ⚠️ **Liveness OK + Readiness FAIL**: Container `healthy` (API pode estar iniciando)
- ❌ **Liveness FAIL**: Container `unhealthy` (restart necessário)

**Nota:** O readiness check não causa falha do container, apenas gera warning logs, permitindo que o container inicie mesmo se a API externa estiver temporariamente indisponível.
