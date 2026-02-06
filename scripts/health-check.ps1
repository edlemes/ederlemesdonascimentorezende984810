param(
    [string]$Target = "local",
    [string]$HostName = "localhost",
    [int]$Port = 5173,
    [int]$Timeout = 5
)

$ErrorActionPreference = "Continue"

function Write-Status {
    param([string]$Message, [string]$Status)
    $color = switch ($Status) {
        "OK"      { "Green" }
        "FAIL"    { "Red" }
        "INFO"    { "Cyan" }
        "WARN"    { "Yellow" }
        default   { "White" }
    }
    Write-Host "[$Status] " -ForegroundColor $color -NoNewline
    Write-Host $Message
}

function Test-ApiEndpoint {
    param([string]$Url, [string]$Name)
    
    Write-Status "Testando $Name..." "INFO"
    $startTime = Get-Date
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $Timeout -UseBasicParsing
        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($response.StatusCode -eq 200) {
            Write-Status "$Name OK (${elapsed}ms)" "OK"
            return $true
        } else {
            Write-Status "$Name retornou status $($response.StatusCode)" "WARN"
            return $false
        }
    } catch {
        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds
        Write-Status "$Name FALHOU (${elapsed}ms): $($_.Exception.Message)" "FAIL"
        return $false
    }
}

function Test-Liveness {
    param([string]$BaseUrl)
    
    Write-Host "`n=== LIVENESS PROBE ===" -ForegroundColor Cyan
    Write-Status "Verifica se a aplicacao esta rodando" "INFO"
    
    $livenessOk = Test-ApiEndpoint "$BaseUrl/health.html" "Liveness (health.html)"
    
    if ($livenessOk) {
        Write-Status "Aplicacao esta VIVA (processo rodando)" "OK"
    } else {
        Write-Status "Aplicacao NAO RESPONDEU (processo morto?)" "FAIL"
    }
    
    return $livenessOk
}

function Test-Readiness {
    param([string]$ApiUrl)
    
    Write-Host "`n=== READINESS PROBE ===" -ForegroundColor Cyan
    Write-Status "Verifica se a API esta pronta para aceitar requests" "INFO"
    
    $apiEndpoint = "$ApiUrl/q/health"
    $readinessOk = Test-ApiEndpoint $apiEndpoint "Readiness (API /q/health)"
    
    if ($readinessOk) {
        Write-Status "API esta PRONTA para receber trafego" "OK"
    } else {
        Write-Status "API NAO ESTA PRONTA (banco down? auth fail?)" "FAIL"
    }
    
    return $readinessOk
}

function Test-HealthCheck {
    param([string]$BaseUrl, [string]$ApiUrl)
    
    Write-Host "`n=== HEALTH CHECK COMPLETO ===" -ForegroundColor Cyan
    Write-Status "Verifica saude geral da aplicacao" "INFO"
    
    $healthOk = Test-ApiEndpoint "$BaseUrl/" "Root endpoint"
    
    if ($healthOk) {
        Write-Status "Frontend esta servindo corretamente" "OK"
    }
    
    return $healthOk
}

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "     Pata Digital - VALIDACAO DE HEALTH CHECKS           " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$baseUrl = "http://${HostName}:${Port}"
$apiUrl = "https://pet-manager-api.geia.vip"

if ($Target -eq "docker") {
    $Port = 3000
    $baseUrl = "http://${HostName}:${Port}"
    Write-Status "Target: Docker Container" "INFO"
} else {
    Write-Status "Target: Desenvolvimento Local" "INFO"
}

Write-Status "Base URL: $baseUrl" "INFO"
Write-Status "API URL: $apiUrl" "INFO"
Write-Status "Timeout: ${Timeout}s" "INFO"

$liveness = Test-Liveness $baseUrl
$readiness = Test-Readiness $apiUrl
$health = Test-HealthCheck $baseUrl $apiUrl

Write-Host "`n=== RESULTADO FINAL ===" -ForegroundColor Cyan

$allPassed = $liveness -and $readiness -and $health

if ($allPassed) {
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host "           TODOS OS CHECKS PASSARAM                      " -ForegroundColor Green
    Write-Host "      Aplicacao esta SAUDAVEL e OPERACIONAL             " -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Green
    exit 0
} else {
    Write-Host "=========================================================" -ForegroundColor Red
    Write-Host "           ALGUNS CHECKS FALHARAM                        " -ForegroundColor Red
    Write-Host "      Verifique os logs acima para detalhes             " -ForegroundColor Red
    Write-Host "=========================================================" -ForegroundColor Red
    
    Write-Host "`nDIAGNOSTICO:" -ForegroundColor Yellow
    if (-not $liveness) {
        Write-Host "  * Liveness FALHOU: Aplicacao nao esta rodando ou nao responde" -ForegroundColor Red
        Write-Host "    > Verifique se o servidor esta iniciado (npm run dev / docker ps)" -ForegroundColor Yellow
    }
    if (-not $readiness) {
        Write-Host "  * Readiness FALHOU: API externa nao esta acessivel" -ForegroundColor Red
        Write-Host "    > Verifique conectividade com https://pet-manager-api.geia.vip" -ForegroundColor Yellow
        Write-Host "    > Verifique se autenticacao esta configurada corretamente" -ForegroundColor Yellow
    }
    if (-not $health) {
        Write-Host "  * Health Check FALHOU: Frontend nao esta servindo" -ForegroundColor Red
        Write-Host "    > Verifique logs do servidor/container" -ForegroundColor Yellow
    }
    
    exit 1
}
