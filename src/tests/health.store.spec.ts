import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HealthStore } from '../app/core/health/health.store'
import { healthService } from '../app/core/health/health.service'

vi.mock('../app/core/health/health.service', () => ({
  healthService: {
    checkHealth: vi.fn(),
  },
}))

describe('HealthStore', () => {
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

  describe('performHealthCheck()', () => {
    it('should perform health check and update state', async () => {
      const mockHealthCheck = {
        status: 'healthy' as const,
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

    it('should set isChecking to true during check', async () => {
      let resolveHealthCheck: any
      vi.mocked(healthService.checkHealth).mockImplementation(
        () => new Promise((resolve) => { resolveHealthCheck = resolve })
      )

      const checkingStates: boolean[] = []
      const sub = store.isChecking$.subscribe((value) => checkingStates.push(value))

      const promise = store.performHealthCheck()

      expect(checkingStates).toContain(true)

      resolveHealthCheck({ status: 'healthy', timestamp: Date.now(), apiAvailable: true })
      await promise

      sub.unsubscribe()
      expect(checkingStates.at(-1)).toBe(false)
    })

    it('should handle health check failure', async () => {
      vi.mocked(healthService.checkHealth).mockRejectedValue(new Error('API down'))

      const emitted: any[] = []
      const sub = store.health$.subscribe((value) => emitted.push(value))

      await store.performHealthCheck()

      sub.unsubscribe()
      const lastEmitted = emitted.at(-1)
      expect(lastEmitted.status).toBe('unhealthy')
      expect(lastEmitted.apiAvailable).toBe(false)
    })

    it('should not start new check if already checking', async () => {
      let resolveHealthCheck: any
      vi.mocked(healthService.checkHealth).mockImplementation(
        () => new Promise((resolve) => { resolveHealthCheck = resolve })
      )

      const promise1 = store.performHealthCheck()
      const promise2 = store.performHealthCheck()

      resolveHealthCheck({ status: 'healthy', timestamp: Date.now(), apiAvailable: true })
      await Promise.all([promise1, promise2])

      expect(healthService.checkHealth).toHaveBeenCalledOnce()
    })

    it('should reset isChecking even on error', async () => {
      vi.mocked(healthService.checkHealth).mockRejectedValue(new Error('Network error'))

      const checkingStates: boolean[] = []
      const sub = store.isChecking$.subscribe((value) => checkingStates.push(value))

      await store.performHealthCheck()

      sub.unsubscribe()
      expect(checkingStates.at(-1)).toBe(false)
    })
  })

  describe('startPeriodicCheck()', () => {
    it('should start periodic health checks', async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: 'healthy',
        timestamp: Date.now(),
        apiAvailable: true,
      })

      store.startPeriodicCheck(1000)
      await vi.runOnlyPendingTimersAsync()

      const initialCalls = vi.mocked(healthService.checkHealth).mock.calls.length
      expect(initialCalls).toBeGreaterThanOrEqual(1)

      await vi.advanceTimersByTimeAsync(1000)
      expect(healthService.checkHealth).toHaveBeenCalledTimes(initialCalls + 1)

      await vi.advanceTimersByTimeAsync(1000)
      expect(healthService.checkHealth).toHaveBeenCalledTimes(initialCalls + 2)

      store.stopPeriodicCheck()
    })

    it('should perform immediate check on start', async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: 'healthy',
        timestamp: Date.now(),
        apiAvailable: true,
      })

      store.startPeriodicCheck(5000)
      await vi.runOnlyPendingTimersAsync()

      expect(healthService.checkHealth).toHaveBeenCalled()

      store.stopPeriodicCheck()
    })

    it('should stop previous interval before starting new one', async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: 'healthy',
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

    it('should use default interval of 30000ms', async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: 'healthy',
        timestamp: Date.now(),
        apiAvailable: true,
      })

      store.startPeriodicCheck()
      await vi.runOnlyPendingTimersAsync()

      const initialCalls = vi.mocked(healthService.checkHealth).mock.calls.length
      expect(initialCalls).toBeGreaterThanOrEqual(1)

      await vi.advanceTimersByTimeAsync(30000)
      expect(healthService.checkHealth).toHaveBeenCalledTimes(initialCalls + 1)

      store.stopPeriodicCheck()
    })
  })

  describe('stopPeriodicCheck()', () => {
    it('should stop periodic checks', async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: 'healthy',
        timestamp: Date.now(),
        apiAvailable: true,
      })

      store.startPeriodicCheck(1000)
      await vi.runOnlyPendingTimersAsync()

      const callsBeforeStop = vi.mocked(healthService.checkHealth).mock.calls.length

      store.stopPeriodicCheck()
      await vi.advanceTimersByTimeAsync(5000)

      expect(vi.mocked(healthService.checkHealth).mock.calls.length).toBe(callsBeforeStop)
    })

    it('should be safe to call when no interval is running', () => {
      expect(() => store.stopPeriodicCheck()).not.toThrow()
    })

    it('should be safe to call multiple times', () => {
      store.startPeriodicCheck(1000)
      store.stopPeriodicCheck()
      
      expect(() => store.stopPeriodicCheck()).not.toThrow()
    })
  })

  describe('getCurrentStatus()', () => {
    it('should return current status', async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: 'healthy',
        timestamp: Date.now(),
        apiAvailable: true,
      })

      await store.performHealthCheck()

      expect(store.getCurrentStatus()).toBe('healthy')
    })

    it('should return checking as initial status', () => {
      expect(store.getCurrentStatus()).toBe('checking')
    })

    it('should return unhealthy after failed check', async () => {
      vi.mocked(healthService.checkHealth).mockRejectedValue(new Error('API down'))

      await store.performHealthCheck()

      expect(store.getCurrentStatus()).toBe('unhealthy')
    })
  })

  describe('isHealthy()', () => {
    it('should return true when status is healthy', async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: 'healthy',
        timestamp: Date.now(),
        apiAvailable: true,
      })

      await store.performHealthCheck()

      expect(store.isHealthy()).toBe(true)
    })

    it('should return false when status is unhealthy', async () => {
      vi.mocked(healthService.checkHealth).mockRejectedValue(new Error('API down'))

      await store.performHealthCheck()

      expect(store.isHealthy()).toBe(false)
    })

    it('should return false when status is checking', () => {
      expect(store.isHealthy()).toBe(false)
    })
  })

  describe('observables', () => {
    it('should emit health check updates via health$', async () => {
      const mockHealthCheck = {
        status: 'healthy' as const,
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

    it('should emit checking state via isChecking$', async () => {
      vi.mocked(healthService.checkHealth).mockResolvedValue({
        status: 'healthy',
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
