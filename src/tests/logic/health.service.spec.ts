import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { HealthService } from "../../app/core/health/health.service"
import axios from "axios"

vi.mock("axios")

vi.mock("../../app/core/api/http.service", () => ({
  API_URL: "https://pet-manager-api.geia.vip",
}))

describe("HealthService", () => {
  let service: HealthService
  let mockedAxios: any

  beforeEach(() => {
    service = new HealthService()
    mockedAxios = vi.mocked(axios)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("checkHealth", () => {
    it("retorna status healthy quando API responde com sucesso", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      const result = await service.checkHealth()

      expect(result.status).toBe("healthy")
      expect(result.apiAvailable).toBe(true)
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it("retorna status unhealthy quando a API falha", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Erro de rede"))

      const result = await service.checkHealth()

      expect(result.status).toBe("unhealthy")
      expect(result.apiAvailable).toBe(false)
      expect(result.responseTime).toBeUndefined()
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it("chama endpoint correto com timeout", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      await service.checkHealth()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/q/health"),
        expect.objectContaining({
          timeout: 5000,
        }),
      )
    })

    it("mede tempo de resposta com precisão", async () => {
      mockedAxios.get.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ status: 200, data: {} }), 50),
          ),
      )

      const result = await service.checkHealth()

      expect(result.responseTime).toBeGreaterThanOrEqual(45)
      expect(result.responseTime).toBeLessThan(200)
    })
  })

  describe("checkLiveness", () => {
    it("retorna true quando API está acessível", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      const result = await service.checkLiveness()

      expect(result).toBe(true)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/q/health"),
        expect.objectContaining({ timeout: 3000 }),
      )
    })

    it("retorna false quando a API é inalcançável", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Conexão recusada"))

      const result = await service.checkLiveness()

      expect(result).toBe(false)
    })

    it("retorna false em caso de timeout", async () => {
      mockedAxios.get.mockRejectedValue({ code: "ECONNABORTED" })

      const result = await service.checkLiveness()

      expect(result).toBe(false)
    })
  })

  describe("checkReadiness", () => {
    it("retorna true quando API retorna 200", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      const result = await service.checkReadiness()

      expect(result).toBe(true)
    })

    it("retorna false quando API retorna status diferente de 200", async () => {
      mockedAxios.get.mockResolvedValue({ status: 503, data: {} })

      const result = await service.checkReadiness()

      expect(result).toBe(false)
    })

    it("retorna false quando a requisição falha", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Serviço indisponível"))

      const result = await service.checkReadiness()

      expect(result).toBe(false)
    })

    it("usa configuração de timeout correta", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      await service.checkReadiness()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/q/health"),
        expect.objectContaining({ timeout: 3000 }),
      )
    })
  })

  describe("tratamento de erros", () => {
    it("trata erros de rede corretamente", async () => {
      mockedAxios.get.mockRejectedValue({
        message: "Erro de rede",
        code: "ERR_NETWORK",
      })

      const result = await service.checkHealth()

      expect(result.status).toBe("unhealthy")
      expect(result.apiAvailable).toBe(false)
    })

    it("trata timeouts corretamente", async () => {
      mockedAxios.get.mockRejectedValue({
        message: "Tempo esgotado",
        code: "ECONNABORTED",
      })

      const result = await service.checkHealth()

      expect(result.status).toBe("unhealthy")
    })

    it("trata erros inesperados corretamente", async () => {
      mockedAxios.get.mockRejectedValue("Erro inesperado")

      const result = await service.checkHealth()

      expect(result.status).toBe("unhealthy")
      expect(result.apiAvailable).toBe(false)
    })
  })
})
