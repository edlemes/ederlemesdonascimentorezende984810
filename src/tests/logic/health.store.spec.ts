import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { HealthStore } from "../../app/core/health/health.store"
import { healthService } from "../../app/core/health/health.service"

vi.mock("../../app/core/health/health.service", () => ({
  healthService: {
    checkHealth: vi.fn(),
  },
}))

describe("HealthStore", () => {
  let store: HealthStore

  beforeEach(() => {
    store = new HealthStore()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    store.stopPeriodicCheck()
    vi.restoreAllMocks()
  })

  describe("performHealthCheck()", () => {
    it("deve realizar health check e atualizar estado", async () => {
      const mockHealthCheck = {
        status: "healthy" as const,
        timestamp: Date.now(),
        apiAvailable: true,
      }
      vi.mocked(healthService.checkHealth).mockResolvedValue(mockHealthCheck)

      const emitted: any[] = []
      const sub = store.health$.subscribe((value) => emitted.push(value))

      await store.performHealthCheck()

      sub.unsubscribe()
      expect(emitted.at(-1)).toEqual(mockHealthCheck)
      expect(healthService.checkHealth).toHaveBeenCalledOnce()
    })

    it("deve definir isChecking como true durante verificação", async () => {
      let resolveHealthCheck: any
      vi.mocked(healthService.checkHealth).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveHealthCheck = resolve
          }),
      )

      const checkingStates: boolean[] = []
      const sub = store.isChecking$.subscribe((value) =>
        checkingStates.push(value),
      )

      const promise = store.performHealthCheck()

      expect(checkingStates).toContain(true)

      resolveHealthCheck({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })
      await promise

      sub.unsubscribe()
      expect(checkingStates.at(-1)).toBe(false)
    })

    it("deve tratar falha no health check", async () => {
      vi.mocked(healthService.checkHealth).mockRejectedValue(
        new Error("API indisponível"),
      )

      const emitted: any[] = []
      const sub = store.health$.subscribe((value) => emitted.push(value))

      await store.performHealthCheck()

      sub.unsubscribe()
      const lastEmitted = emitted.at(-1)
      expect(lastEmitted.status).toBe("unhealthy")
      expect(lastEmitted.apiAvailable).toBe(false)
    })

    it("não deve iniciar nova verificação se já estiver verificando", async () => {
      let resolveHealthCheck: any
      vi.mocked(healthService.checkHealth).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveHealthCheck = resolve
          }),
      )

      const promise1 = store.performHealthCheck()
      const promise2 = store.performHealthCheck()

      resolveHealthCheck({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })
      await Promise.all([promise1, promise2])

      expect(healthService.checkHealth).toHaveBeenCalledOnce()
    })

    it("deve resetar isChecking mesmo em caso de erro", async () => {
      vi.mocked(healthService.checkHealth).mockRejectedValue(
        new Error("Erro de rede"),
      )

      const checkingStates: boolean[] = []
      const sub = store.isChecking$.subscribe((value) =>
        checkingStates.push(value),
      )

      await store.performHealthCheck()

      sub.unsubscribe()
      expect(checkingStates.at(-1)).toBe(false)
    })
  })

  describe("startPeriodicCheck()", () => {
    it("deve iniciar verificações periódicas de saúde", async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })

      store.startPeriodicCheck(1000)
      await vi.runOnlyPendingTimersAsync()

      const initialCalls = vi.mocked(healthService.checkHealth).mock.calls
        .length
      expect(initialCalls).toBeGreaterThanOrEqual(1)

      await vi.advanceTimersByTimeAsync(1000)
      expect(healthService.checkHealth).toHaveBeenCalledTimes(initialCalls + 1)

      await vi.advanceTimersByTimeAsync(1000)
      expect(healthService.checkHealth).toHaveBeenCalledTimes(initialCalls + 2)

      store.stopPeriodicCheck()
    })

    it("deve realizar verificação imediata ao iniciar", async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })

      store.startPeriodicCheck(5000)
      await vi.runOnlyPendingTimersAsync()

      expect(healthService.checkHealth).toHaveBeenCalled()

      store.stopPeriodicCheck()
    })

    it("deve parar intervalo anterior antes de iniciar novo", async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })

      store.startPeriodicCheck(1000)
      await vi.runOnlyPendingTimersAsync()

      vi.clearAllMocks()

      store.startPeriodicCheck(1000)
      await vi.runOnlyPendingTimersAsync()

      expect(healthService.checkHealth).toHaveBeenCalled()

      store.stopPeriodicCheck()
    })

    it("deve usar intervalo padrão de 30000ms", async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })

      store.startPeriodicCheck()
      await vi.runOnlyPendingTimersAsync()

      const initialCalls = vi.mocked(healthService.checkHealth).mock.calls
        .length
      expect(initialCalls).toBeGreaterThanOrEqual(1)

      await vi.advanceTimersByTimeAsync(30000)
      expect(healthService.checkHealth).toHaveBeenCalledTimes(initialCalls + 1)

      store.stopPeriodicCheck()
    })
  })

  describe("stopPeriodicCheck()", () => {
    it("deve parar verificações periódicas", async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })

      store.startPeriodicCheck(1000)
      await vi.runOnlyPendingTimersAsync()

      const callsBeforeStop = vi.mocked(healthService.checkHealth).mock.calls
        .length

      store.stopPeriodicCheck()
      await vi.advanceTimersByTimeAsync(5000)

      expect(vi.mocked(healthService.checkHealth).mock.calls.length).toBe(
        callsBeforeStop,
      )
    })

    it("deve ser seguro chamar quando nenhum intervalo estiver rodando", () => {
      expect(() => store.stopPeriodicCheck()).not.toThrow()
    })

    it("deve ser seguro chamar múltiplas vezes", () => {
      store.startPeriodicCheck(1000)
      store.stopPeriodicCheck()

      expect(() => store.stopPeriodicCheck()).not.toThrow()
    })
  })

  describe("getCurrentStatus()", () => {
    it("deve retornar status atual", async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })

      await store.performHealthCheck()

      expect(store.getCurrentStatus()).toBe("healthy")
    })

    it("deve retornar checking como status inicial", () => {
      expect(store.getCurrentStatus()).toBe("checking")
    })

    it("deve retornar unhealthy após cheque falho", async () => {
      vi.mocked(healthService.checkHealth).mockRejectedValue(
        new Error("API indisponível"),
      )

      await store.performHealthCheck()

      expect(store.getCurrentStatus()).toBe("unhealthy")
    })
  })

  describe("isHealthy()", () => {
    it("deve retornar true quando status for healthy", async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })

      await store.performHealthCheck()

      expect(store.isHealthy()).toBe(true)
    })

    it("deve retornar false quando o status for unhealthy", async () => {
      vi.mocked(healthService.checkHealth).mockRejectedValue(
        new Error("API indisponível"),
      )

      await store.performHealthCheck()

      expect(store.isHealthy()).toBe(false)
    })

    it("deve retornar false quando status for checking", () => {
      expect(store.isHealthy()).toBe(false)
    })
  })

  describe("observáveis", () => {
    it("deve emitir atualizações de health check via health$", async () => {
      const mockHealthCheck = {
        status: "healthy" as const,
        timestamp: Date.now(),
        apiAvailable: true,
      }
      vi.mocked(healthService.checkHealth).mockResolvedValue(mockHealthCheck)

      const emitted: any[] = []
      const sub = store.health$.subscribe((value) => emitted.push(value))

      await store.performHealthCheck()

      sub.unsubscribe()
      expect(emitted.length).toBeGreaterThan(1)
      expect(emitted.at(-1)).toEqual(mockHealthCheck)
    })

    it("deve emitir estado de verificação via isChecking$", async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
      })

      const emitted: boolean[] = []
      const sub = store.isChecking$.subscribe((value) => emitted.push(value))

      await store.performHealthCheck()

      sub.unsubscribe()
      expect(emitted).toContain(false)
      expect(emitted).toContain(true)
    })
  })
})
