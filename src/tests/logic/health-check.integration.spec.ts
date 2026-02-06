import { describe, it, expect, beforeAll } from "vitest"
import axios from "axios"

const BASE_URL = process.env.VITE_API_URL || "http://localhost:5173"
const API_URL = "https://pet-manager-api.geia.vip"

describe("Testes de Integração de Health Checks", () => {
  describe("Sonda de Prontidão", () => {
    it("deve conectar ao endpoint de saúde da API", async () => {
      const response = await axios.get(`${API_URL}/q/health`, {
        timeout: 5000,
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty("status")
      expect(response.data.status).toBe("UP")
    }, 10000)

    it("deve responder em tempo aceitável", async () => {
      const startTime = Date.now()

      await axios.get(`${API_URL}/q/health`, {
        timeout: 5000,
      })

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(5000)
    }, 10000)
  })

  describe("Saúde da Aplicação", () => {
    it("deve servir o caminho raiz", async () => {
      const response = await axios.get(BASE_URL, {
        timeout: 5000,
      })

      expect(response.status).toBe(200)
      expect(response.headers["content-type"]).toContain("text/html")
    }, 10000)

    it("deve servir assets estáticos", async () => {
      const response = await axios.get(BASE_URL, {
        timeout: 5000,
      })

      expect(response.status).toBe(200)
      expect(response.data).toBeTruthy()
      expect(response.data.length).toBeGreaterThan(0)
    }, 10000)
  })

  describe("Integração do Health Check Service", () => {
    let healthService: any

    beforeAll(async () => {
      const module = await import("../../app/core/health/health.service")
      healthService = module.healthService
    })

    it("deve passar na verificação de liveness", async () => {
      const isAlive = await healthService.checkLiveness()
      expect(isAlive).toBe(true)
    }, 10000)

    it("deve passar na verificação de readiness", async () => {
      const isReady = await healthService.checkReadiness()
      expect(isReady).toBe(true)
    }, 10000)

    it("deve retornar status de saúde completo", async () => {
      const health = await healthService.checkHealth()

      expect(health).toHaveProperty("status")
      expect(health).toHaveProperty("timestamp")
      expect(health).toHaveProperty("apiAvailable")
      expect(health.status).toBe("healthy")
      expect(health.apiAvailable).toBe(true)

      if (health.responseTime) {
        expect(health.responseTime).toBeGreaterThan(0)
        expect(health.responseTime).toBeLessThan(10000)
      }
    }, 10000)
  })

  describe("Tratamento de Erros", () => {
    it("deve tratar timeout corretamente", async () => {
      try {
        await axios.get(`${API_URL}/q/health`, {
          timeout: 1,
        })
        expect.fail("Deveria ter lançado erro de timeout")
      } catch (error: any) {
        expect(error.code).toBe("ECONNABORTED")
      }
    }, 10000)

    it("deve tratar endpoint indisponível", async () => {
      try {
        await axios.get(`${BASE_URL}/non-existent-endpoint`, {
          timeout: 5000,
        })
        expect.fail("Deveria ter lançado erro 404")
      } catch (error: any) {
        expect(error.response?.status).toBe(404)
      }
    }, 10000)
  })
})
