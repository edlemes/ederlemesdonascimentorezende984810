import { BehaviorSubject, Observable } from 'rxjs'
import { authService } from '../api/auth.service'
import { tokenManager } from '../../../core/api/api.client'
import type { User, LoginRequest } from '../models/user.model'
import type { AuthService } from '../api/auth.service'
import type { TokenManager } from '../../../core/api/api-types'

export type EnvReader = (key: string) => string | undefined

const defaultEnvReader: EnvReader = (key: string) => {
  const env = import.meta.env as unknown as Record<string, string | undefined>
  return env[key]
}

const tryGetJwtExpMs = (token: string): number | null => {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  const payload = parts[1]
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')

  try {
    if (typeof atob !== 'function') {
      return null
    }

    const json = atob(padded)

    const parsed = JSON.parse(json) as { exp?: number }
    if (typeof parsed.exp !== 'number') {
      return null
    }

    return parsed.exp * 1000
  } catch {
    return null
  }
}

export class AuthFacade {
  private _user$ = new BehaviorSubject<User | null>(null)
  private _isAuthenticated$ = new BehaviorSubject<boolean>(false)
  private _isLoading$ = new BehaviorSubject<boolean>(false)
  private _token$ = new BehaviorSubject<string | null>(null)

  public user$: Observable<User | null> = this._user$.asObservable()
  public isAuthenticated$: Observable<boolean> = this._isAuthenticated$.asObservable()
  public isLoading$: Observable<boolean> = this._isLoading$.asObservable()
  public token$: Observable<string | null> = this._token$.asObservable()

  private authApi: AuthService
  private tokenMgr: TokenManager
  private envReader: EnvReader

  constructor(authService_?: AuthService, tokenManager_?: TokenManager, envReader_?: EnvReader) {
    this.authApi = authService_ ?? authService
    this.tokenMgr = tokenManager_ ?? tokenManager
    this.envReader = envReader_ ?? defaultEnvReader
    this.restoreSession()
  }

  private clearSession(): void {
    this.tokenMgr.clearToken()
    this._token$.next(null)
    this._user$.next(null)
    this._isAuthenticated$.next(false)
  }

  private restoreSession(): void {
    const token = this.tokenMgr.getToken()
    if (token) {
      this._token$.next(token)

      const expMs = tryGetJwtExpMs(token)
      if (expMs !== null && expMs <= Date.now()) {
        this.clearSession()
        return
      }

      this._isAuthenticated$.next(true)
      this._isLoading$.next(true)

      void this.authApi
        .refresh()
        .then((res) => {
          if (!res?.token) {
            throw new Error('Missing token')
          }
          this.tokenMgr.setToken(res.token)
          this._token$.next(res.token)
          this._user$.next(res.user ?? null)
          this._isAuthenticated$.next(true)
        })
        .catch(() => this.clearSession())
        .finally(() => this._isLoading$.next(false))
    }
  }

  async login(credentials: LoginRequest): Promise<void> {
    this._isLoading$.next(true)
    try {
      const res = await this.authApi.login(credentials)
      this.tokenMgr.setToken(res.token)
      this._token$.next(res.token)
      this._user$.next(res.user || null)
      this._isAuthenticated$.next(true)
    } catch (err) {
      this.clearSession()
      throw err
    } finally {
      this._isLoading$.next(false)
    }
  }

  async autoLogin(): Promise<void> {
    const existingToken = this.tokenMgr.getToken()
    
    if (existingToken && this._isAuthenticated$.value) {
      return
    }

    const username = this.envReader('VITE_AUTH_USERNAME')
    const password = this.envReader('VITE_AUTH_PASSWORD')
    
    if (username && password) {
      await this.login({ username, password }).catch(() => undefined)
    }
  }

  logout(): void {
    this.authApi.logout()
    this.clearSession()
  }

  getToken(): string | null {
    return this._token$.value
  }
}

export const createAuthFacade = (
  authApi?: AuthService,
  tokenMgr?: TokenManager,
  envReader?: EnvReader
): AuthFacade => new AuthFacade(authApi, tokenMgr, envReader)

export const authFacade = createAuthFacade()
