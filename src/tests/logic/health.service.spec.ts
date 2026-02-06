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
    it("returns healthy status when API responds successfully", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      const result = await service.checkHealth()

      expect(result.status).toBe("healthy")
      expect(result.apiAvailable).toBe(true)
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it("returns unhealthy status when API fails", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"))

      const result = await service.checkHealth()

      expect(result.status).toBe("unhealthy")
      expect(result.apiAvailable).toBe(false)
      expect(result.responseTime).toBeUndefined()
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it("calls correct endpoint with timeout", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      await service.checkHealth()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/q/health"),
        expect.objectContaining({
          timeout: 5000,
        }),
      )
    })

    it("measures response time accurately", async () => {
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
    it("returns true when API is reachable", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      const result = await service.checkLiveness()

      expect(result).toBe(true)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/q/health"),
        expect.objectContaining({ timeout: 3000 }),
      )
    })

    it("returns false when API is unreachable", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Connection refused"))

      const result = await service.checkLiveness()

      expect(result).toBe(false)
    })

    it("returns false on timeout", async () => {
      mockedAxios.get.mockRejectedValue({ code: "ECONNABORTED" })

      const result = await service.checkLiveness()

      expect(result).toBe(false)
    })
  })

  describe("checkReadiness", () => {
    it("returns true when API returns 200", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      const result = await service.checkReadiness()

      expect(result).toBe(true)
    })

    it("returns false when API returns non-200 status", async () => {
      mockedAxios.get.mockResolvedValue({ status: 503, data: {} })

      const result = await service.checkReadiness()

      expect(result).toBe(false)
    })

    it("returns false when request fails", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Service unavailable"))

      const result = await service.checkReadiness()

      expect(result).toBe(false)
    })

    it("uses correct timeout configuration", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} })

      await service.checkReadiness()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/q/health"),
        expect.objectContaining({ timeout: 3000 }),
      )
    })
  })

  describe("error handling", () => {
    it("handles network errors gracefully", async () => {
      mockedAxios.get.mockRejectedValue({
        message: "Network Error",
        code: "ERR_NETWORK",
      })

      const result = await service.checkHealth()

      expect(result.status).toBe("unhealthy")
      expect(result.apiAvailable).toBe(false)
    })

    it("handles timeout errors gracefully", async () => {
      mockedAxios.get.mockRejectedValue({
        message: "Timeout",
        code: "ECONNABORTED",
      })

      const result = await service.checkHealth()

      expect(result.status).toBe("unhealthy")
    })

    it("handles unexpected errors gracefully", async () => {
      mockedAxios.get.mockRejectedValue("Unexpected error")

      const result = await service.checkHealth()

      expect(result.status).toBe("unhealthy")
      expect(result.apiAvailable).toBe(false)
    })
  })
})
