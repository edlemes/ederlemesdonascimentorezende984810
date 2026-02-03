import { httpClient, tokenManager, API_ENDPOINTS } from '../../../core/api/api.client'
import type { LoginRequest, LoginResponse } from '../models/user.model'

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await httpClient.post(API_ENDPOINTS.auth.login, credentials)
    const data = res.data
    const token = data.access_token || data.token
    if (token) {
      tokenManager.setToken(token)
      return { token, user: data.user }
    }
    return data
  }

  async refresh(): Promise<LoginResponse> {
    const res = await httpClient.put(API_ENDPOINTS.auth.refresh)
    const data = res.data
    const token = data.access_token || data.token
    if (token) {
      tokenManager.setToken(token)
      return { token, user: data.user }
    }
    return data
  }

  logout(): void {
    tokenManager.clearToken()
  }
}

export const authService = new AuthService()
