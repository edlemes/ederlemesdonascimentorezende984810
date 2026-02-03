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

  private restoreSession(): void {
    const token = this.tokenMgr.getToken()
    if (token) {
      this._token$.next(token)
      this._isAuthenticated$.next(true)
    }
  }

  async login(credentials: LoginRequest): Promise<void> {
    this._isLoading$.next(true)
    try {
      const res = await this.authApi.login(credentials)
      this._token$.next(res.token)
      this._user$.next(res.user || null)
      this._isAuthenticated$.next(true)
    } catch (err) {
      this._token$.next(null)
      this._user$.next(null)
      this._isAuthenticated$.next(false)
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
      try {
        await this.login({ username, password })
      } catch {
        return
      }
    }
  }

  logout(): void {
    this.authApi.logout()
    this._token$.next(null)
    this._user$.next(null)
    this._isAuthenticated$.next(false)
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
