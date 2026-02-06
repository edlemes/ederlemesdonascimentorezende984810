# Scripts de Automação e Validação

Este diretório contém os scripts de automação para validação de health checks e operações DevOps do projeto **Pata Digital**.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Scripts Disponíveis](#scripts-disponíveis)
3. [Health Check Scripts](#health-check-scripts)
4. [Docker Health Check](#docker-health-check)
5. [Uso em CI/CD](#uso-em-cicd)
6. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Os scripts neste diretório implementam os **Health Checks** para garantir a resiliência da aplicação em ambiente de produção.

### Arquivos

| Script                  | Plataforma           | Propósito                            |
| ----------------------- | -------------------- | ------------------------------------ |
| `health-check.ps1`      | Windows (PowerShell) | Validação interativa de probes       |
| `health-check.sh`       | Unix/Linux/macOS     | Validação interativa de probes       |
| `docker-healthcheck.sh` | Docker Container     | Health check automático do container |

---

## Scripts Disponíveis

### health-check.ps1 (Windows)

Script PowerShell para validação de Liveness e Readiness probes em ambiente Windows.

**Sintaxe:**

```powershell
.\scripts\health-check.ps1 [-Target <string>] [-HostName <string>] [-Port <int>] [-Timeout <int>]
```

**Parâmetros:**

| Parâmetro   | Tipo   | Default                          | Descrição           |
| ----------- | ------ | -------------------------------- | ------------------- |
| `-Target`   | string | `local`                          | `local` ou `docker` |
| `-HostName` | string | `localhost`                      | Host da aplicação   |
| `-Port`     | int    | `5173` (local) / `3000` (docker) | Porta da aplicação  |
| `-Timeout`  | int    | `5`                              | Timeout em segundos |

**Exemplos:**

```powershell
# Validar servidor de desenvolvimento local
.\scripts\health-check.ps1

# Validar container Docker
.\scripts\health-check.ps1 -Target docker

# Customizar host e porta
.\scripts\health-check.ps1 -HostName 192.168.1.100 -Port 8080

# Aumentar timeout para redes lentas
.\scripts\health-check.ps1 -Timeout 15
```

---

### health-check.sh (Unix/Linux/macOS)

Script Bash equivalente para sistemas Unix-like.

**Sintaxe:**

```bash
./scripts/health-check.sh [target] [hostname] [port] [timeout]
```

**Parâmetros:**

| Posição      | Default                          | Descrição           |
| ------------ | -------------------------------- | ------------------- |
| 1 (target)   | `local`                          | `local` ou `docker` |
| 2 (hostname) | `localhost`                      | Host da aplicação   |
| 3 (port)     | `5173` (local) / `3000` (docker) | Porta da aplicação  |
| 4 (timeout)  | `5`                              | Timeout em segundos |

**Exemplos:**

```bash
# Dar permissão de execução (primeira vez)
chmod +x scripts/health-check.sh

# Validar ambiente local
./scripts/health-check.sh

# Validar container Docker
./scripts/health-check.sh docker

# Customizar parâmetros
./scripts/health-check.sh local 192.168.1.100 8080 15
```

---

### docker-healthcheck.sh

Script executado automaticamente pelo Docker HEALTHCHECK para validar a saúde do container.

**Localização no container:** `/usr/local/bin/healthcheck.sh`

**Funcionamento:**

1. Verifica se o Nginx está respondendo (Liveness)
2. Verifica se a API externa está acessível (Readiness)
3. Retorna código de saída apropriado

**Não é necessário executar manualmente** - o Docker executa automaticamente conforme configuração no Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh || exit 1
```

---

## Health Check Scripts

### Conceitos de Probes

Os health checks seguem o padrão Kubernetes/Docker para verificação de saúde:

| Probe         | Propósito                     | Falha Indica                     |
| ------------- | ----------------------------- | -------------------------------- |
| **Liveness**  | Aplicação está viva           | Processo morreu, precisa restart |
| **Readiness** | Aplicação pronta para tráfego | Dependências não prontas         |

### Endpoints Verificados

| Probe          | Endpoint                                    | Método | Timeout |
| -------------- | ------------------------------------------- | ------ | ------- |
| Liveness       | `http://localhost:{port}/health.html`       | HEAD   | 3s      |
| Readiness      | `https://pet-manager-api.geia.vip/q/health` | GET    | 5s      |
| General Health | `http://localhost:{port}/`                  | GET    | 5s      |

### Output Esperado

**Sucesso:**

```
=========================================================
     Pata Digital - VALIDAÇÃO DE HEALTH CHECKS
=========================================================
[INFO] Target: Desenvolvimento Local
[INFO] Base URL: http://localhost:5173
[INFO] API URL: https://pet-manager-api.geia.vip
[INFO] Timeout: 5s

=== LIVENESS PROBE ===
[INFO] Verifica se a aplicacao esta rodando
[INFO] Testando Liveness (health.html)...
[OK] Liveness (health.html) OK (12ms)
[OK] Aplicacao esta VIVA (processo rodando)

=== READINESS PROBE ===
[INFO] Verifica se a API esta pronta para aceitar requests
[INFO] Testando Readiness (API /q/health)...
[OK] Readiness (API /q/health) OK (245ms)
[OK] API esta PRONTA para receber trafego

=== HEALTH CHECK COMPLETO ===
[INFO] Verifica saude geral da aplicacao
[INFO] Testando Root endpoint...
[OK] Root endpoint OK (8ms)
[OK] Frontend esta servindo corretamente

=== RESULTADO FINAL ===
=========================================================
           TODOS OS CHECKS PASSARAM
      Aplicacao esta SAUDAVEL e OPERACIONAL
=========================================================
```

**Falha:**

```
=== RESULTADO FINAL ===
=========================================================
           ALGUNS CHECKS FALHARAM
      Verifique os logs acima para detalhes
=========================================================

DIAGNOSTICO:
  * Liveness FALHOU: Aplicacao nao esta rodando ou nao responde
    > Verifique se o servidor esta iniciado (npm run dev / docker ps)
```

### Códigos de Saída

| Código | Significado                |
| ------ | -------------------------- |
| `0`    | Todos os checks passaram   |
| `1`    | Um ou mais checks falharam |

---

## Docker Health Check

### Configuração no Dockerfile

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh || exit 1
```

| Parâmetro        | Valor | Descrição                              |
| ---------------- | ----- | -------------------------------------- |
| `--interval`     | 30s   | Intervalo entre execuções              |
| `--timeout`      | 10s   | Tempo máximo de execução               |
| `--start-period` | 30s   | Período de graça durante inicialização |
| `--retries`      | 3     | Tentativas antes de unhealthy          |

### Verificar Status do Container

```bash
# Status resumido
docker ps --format "table {{.Names}}\t{{.Status}}"

# Status detalhado
docker inspect --format='{{.State.Health.Status}}' <container>
# Output: healthy | unhealthy | starting

# Histórico de checks
docker inspect --format='{{json .State.Health.Log}}' <container> | jq

# Executar check manualmente
docker exec <container> /usr/local/bin/healthcheck.sh
```

### Comportamento de Falhas

| Cenário                      | Status      | Ação                                   |
| ---------------------------- | ----------- | -------------------------------------- |
| Liveness OK + Readiness OK   | `healthy`   | Normal                                 |
| Liveness OK + Readiness FAIL | `healthy`   | Warning log (API pode estar iniciando) |
| Liveness FAIL                | `unhealthy` | Docker pode reiniciar container        |

**Nota:** Readiness failure NÃO causa unhealthy. Isso é intencional para permitir que o container inicie mesmo se a API externa estiver temporariamente indisponível.

---

## Uso em CI/CD

### GitHub Actions

```yaml
jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Start development server
        run: npm run dev &

      - name: Wait for server
        run: sleep 10

      - name: Health Check
        run: |
          chmod +x ./scripts/health-check.sh
          ./scripts/health-check.sh
```

### GitLab CI

```yaml
stages:
  - build
  - test
  - health-check

health_check:
  stage: health-check
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker compose -f docker-compose.prod.yml up -d --build
    - sleep 30 # Aguardar startup
    - chmod +x ./scripts/health-check.sh
    - ./scripts/health-check.sh docker
  after_script:
    - docker compose -f docker-compose.prod.yml down
```

### Azure DevOps

```yaml
steps:
  - task: Docker@2
    inputs:
      command: "build"
      Dockerfile: "Dockerfile"

  - script: |
      docker run -d --name pata-digital -p 3000:80 pata-digital:latest
      sleep 30
      chmod +x ./scripts/health-check.sh
      ./scripts/health-check.sh docker
    displayName: "Health Check"
```

---

## Troubleshooting

### Liveness Falha

**Sintoma:** `Liveness FALHOU: Aplicacao nao esta rodando`

**Causas:**

1. Servidor de desenvolvimento não iniciado
2. Container não está rodando
3. Porta incorreta

**Soluções:**

```bash
# Verificar se dev server está rodando
npm run dev

# Verificar containers
docker ps

# Verificar porta
netstat -an | grep 5173  # ou 3000 para Docker
```

### Readiness Falha

**Sintoma:** `Readiness FALHOU: API nao esta acessivel`

**Causas:**

1. API externa indisponível
2. Problema de rede/firewall
3. API em manutenção

**Soluções:**

```bash
# Testar API diretamente
curl https://pet-manager-api.geia.vip/q/health

# Verificar DNS
nslookup pet-manager-api.geia.vip

# Verificar conectividade
ping pet-manager-api.geia.vip
```

### Docker Healthcheck Unhealthy

**Sintoma:** Container fica em status `unhealthy`

**Diagnóstico:**

```bash
# Ver output do healthcheck
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' <container>

# Executar manualmente
docker exec <container> /usr/local/bin/healthcheck.sh

# Verificar se arquivos existem
docker exec <container> ls -la /usr/share/nginx/html/health.html
docker exec <container> ls -la /usr/local/bin/healthcheck.sh
```

### Timeout em Redes Lentas

**Sintoma:** Checks falham por timeout

**Solução:**

```powershell
# PowerShell - aumentar timeout
.\scripts\health-check.ps1 -Timeout 30

# Bash
./scripts/health-check.sh local localhost 5173 30
```

---

## Referências

- [Docker Healthcheck Documentation](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Kubernetes Liveness and Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
