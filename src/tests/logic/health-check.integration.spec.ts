import { describe, it, expect, beforeAll } from 'vitest'
import axios from 'axios'

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5173'
const API_URL = 'https://pet-manager-api.geia.vip'

describe('Health Checks Integration Tests', () => {
  describe('Readiness Probe', () => {
    it('should successfully connect to API health endpoint', async () => {
      const response = await axios.get(`${API_URL}/q/health`, {
        timeout: 5000,
      })
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('status')
      expect(response.data.status).toBe('UP')
    }, 10000)

    it('should respond within acceptable time', async () => {
      const startTime = Date.now()
      
      await axios.get(`${API_URL}/q/health`, {
        timeout: 5000,
      })
      
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(5000)
    }, 10000)
  })

  describe('Application Health', () => {
    it('should serve the root path', async () => {
      const response = await axios.get(BASE_URL, {
        timeout: 5000,
      })
      
      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('text/html')
    }, 10000)

    it('should serve static assets', async () => {
      const response = await axios.get(BASE_URL, {
        timeout: 5000,
      })
      
      expect(response.status).toBe(200)
      expect(response.data).toBeTruthy()
      expect(response.data.length).toBeGreaterThan(0)
    }, 10000)
  })

  describe('Health Check Service Integration', () => {
    let healthService: any

    beforeAll(async () => {
      const module = await import(
        '../../app/core/health/health.service'
      )
      healthService = module.healthService
    })

    it('should pass liveness check', async () => {
      const isAlive = await healthService.checkLiveness()
      expect(isAlive).toBe(true)
    }, 10000)

    it('should pass readiness check', async () => {
      const isReady = await healthService.checkReadiness()
      expect(isReady).toBe(true)
    }, 10000)

    it('should return complete health status', async () => {
      const health = await healthService.checkHealth()
      
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('timestamp')
      expect(health).toHaveProperty('apiAvailable')
      expect(health.status).toBe('healthy')
      expect(health.apiAvailable).toBe(true)
      
      if (health.responseTime) {
        expect(health.responseTime).toBeGreaterThan(0)
        expect(health.responseTime).toBeLessThan(10000)
      }
    }, 10000)
  })

  describe('Error Handling', () => {
    it('should handle timeout gracefully', async () => {
      try {
        await axios.get(`${API_URL}/q/health`, {
          timeout: 1,
        })
        expect.fail('Should have thrown timeout error')
      } catch (error: any) {
        expect(error.code).toBe('ECONNABORTED')
      }
    }, 10000)

    it('should handle unavailable endpoint', async () => {
      try {
        await axios.get(`${BASE_URL}/non-existent-endpoint`, {
          timeout: 5000,
        })
        expect.fail('Should have thrown 404 error')
      } catch (error: any) {
        expect(error.response?.status).toBe(404)
      }
    }, 10000)
  })
})
