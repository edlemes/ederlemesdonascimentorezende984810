import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../../app/features/auth/api/auth.service'
import { httpClient, tokenManager } from '../../app/core/api/api.client'

vi.mock('../../app/core/api/api.client', () => ({
  httpClient: {
    post: vi.fn(),
    put: vi.fn(),
  },
  tokenManager: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
  API_ENDPOINTS: {
    auth: {
      login: '/autenticacao/login',
      refresh: '/autenticacao/refresh',
    },
  },
}))

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    service = new AuthService()
    vi.clearAllMocks()
  })

  describe('login()', () => {
    it('should login successfully with access_token', async () => {
      const mockResponse = {
        data: {
          access_token: 'token123',
          user: { id: 1, username: 'test' },
        },
      }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.login({ username: 'test', password: 'pass' })

      expect(httpClient.post).toHaveBeenCalledWith('/autenticacao/login', {
        username: 'test',
        password: 'pass',
      })
      expect(tokenManager.setToken).toHaveBeenCalledWith('token123')
      expect(result).toEqual({
        token: 'token123',
        user: { id: 1, username: 'test' },
      })
    })

    it('should login successfully with token field', async () => {
      const mockResponse = {
        data: {
          token: 'altToken456',
          user: { id: 2, username: 'user2' },
        },
      }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.login({ username: 'user2', password: 'pass2' })

      expect(tokenManager.setToken).toHaveBeenCalledWith('altToken456')
      expect(result).toEqual({
        token: 'altToken456',
        user: { id: 2, username: 'user2' },
      })
    })

    it('should return raw data if no token found', async () => {
      const mockResponse = {
        data: { message: 'No token' },
      }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.login({ username: 'test', password: 'pass' })

      expect(tokenManager.setToken).not.toHaveBeenCalled()
      expect(result).toEqual({ message: 'No token' })
    })

    it('should throw error on network failure', async () => {
      vi.mocked(httpClient.post).mockRejectedValue(new Error('Network error'))

      await expect(service.login({ username: 'test', password: 'pass' })).rejects.toThrow(
        'Network error'
      )
    })

    it('should throw error on 401 unauthorized', async () => {
      const error = { response: { status: 401 } }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.login({ username: 'wrong', password: 'wrong' })).rejects.toEqual(error)
    })
  })

  describe('refresh()', () => {
    it('should refresh token successfully with access_token', async () => {
      const mockResponse = {
        data: {
          access_token: 'newToken789',
          user: { id: 1, username: 'test' },
        },
      }
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse)

      const result = await service.refresh()

      expect(httpClient.put).toHaveBeenCalledWith('/autenticacao/refresh')
      expect(tokenManager.setToken).toHaveBeenCalledWith('newToken789')
      expect(result).toEqual({
        token: 'newToken789',
        user: { id: 1, username: 'test' },
      })
    })

    it('should refresh token successfully with token field', async () => {
      const mockResponse = {
        data: {
          token: 'refreshedToken',
          user: { id: 3, username: 'user3' },
        },
      }
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse)

      const result = await service.refresh()

      expect(tokenManager.setToken).toHaveBeenCalledWith('refreshedToken')
      expect(result).toEqual({
        token: 'refreshedToken',
        user: { id: 3, username: 'user3' },
      })
    })

    it('should return raw data if no token found', async () => {
      const mockResponse = {
        data: { error: 'No token' },
      }
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse)

      const result = await service.refresh()

      expect(tokenManager.setToken).not.toHaveBeenCalled()
      expect(result).toEqual({ error: 'No token' })
    })

    it('should throw error on refresh failure', async () => {
      vi.mocked(httpClient.put).mockRejectedValue(new Error('Refresh failed'))

      await expect(service.refresh()).rejects.toThrow('Refresh failed')
    })

    it('should throw error on 401 during refresh', async () => {
      const error = { response: { status: 401, data: { message: 'Invalid token' } } }
      vi.mocked(httpClient.put).mockRejectedValue(error)

      await expect(service.refresh()).rejects.toEqual(error)
    })
  })

  describe('logout()', () => {
    it('should clear token on logout', () => {
      service.logout()

      expect(tokenManager.clearToken).toHaveBeenCalledOnce()
    })

    it('should not throw error on logout', () => {
      expect(() => service.logout()).not.toThrow()
    })
  })
})
