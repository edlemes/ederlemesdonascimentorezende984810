import axios, { AxiosError } from "axios"
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios"
import type { TokenManager } from "./api-types"

const STORAGE_KEYS = { ACCESS_TOKEN: "pet_manager_token" }

let envOverride: Partial<Record<string, string>> | null = null
let redirectOverride: ((url: string) => void) | null = null

export const __testing = {
  setEnv: (override: Partial<Record<string, string>> | null) => {
    envOverride = override
  },
  setRedirect: (override: ((url: string) => void) | null) => {
    redirectOverride = override
  },
  reset: () => {
    envOverride = null
    redirectOverride = null
  },
}

const getEnvValue = (key: string): string | undefined => {
  if (envOverride && key in envOverride) {
    return envOverride[key]
  }

  const env = import.meta.env as unknown as Record<string, string | undefined>
  return env[key]
}

const getApiUrl = (): string => {
  return getEnvValue("VITE_API_URL") || "https://pet-manager-api.geia.vip"
}

export const API_URL = getApiUrl()

type AuthError = Error & { isAuthError: true }

const createAuthError = (): AuthError => {
  return Object.assign(new Error("Autenticação necessária"), {
    isAuthError: true as const,
  })
}

export const tokenManager: TokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  },
  setToken: (token: string) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
  },
  clearToken: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  },
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

const refreshApi = axios.create({
  baseURL: API_URL,
  timeout: 5000,
})

let isRefreshing = false
let authPromise: Promise<void> | null = null

type FailedQueueItem = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
  request: InternalAxiosRequestConfig & { _retry?: boolean }
}

let failedQueue: FailedQueueItem[] = []

const resolveQueuedRequests = (token: string) => {
  failedQueue.forEach((item) => item.resolve(token))
  failedQueue = []
}

const rejectQueuedRequests = (error: unknown) => {
  failedQueue.forEach((item) => item.reject(error))
  failedQueue = []
}

const setAuthHeader = (request: InternalAxiosRequestConfig, token: string) => {
  request.headers = request.headers ?? {};
  (request.headers as Record<string, string>).Authorization = `Bearer ${token}`
}

const getTokenFromResponse = (data: unknown): string | null => {
  if (!data || typeof data !== "object") {
    return null
  }

  const record = data as Record<string, unknown>
  const candidates = [record.access_token, record.token, record.accessToken]
  const token = candidates.find((value) => typeof value === "string")
  return (token as string | undefined) ?? null
}

const cleanupAuth = () => {
  tokenManager.clearToken()
  isRefreshing = false
}

const attemptReAuthentication = async (): Promise<string | null> => {
  const username = getEnvValue("VITE_AUTH_USERNAME")
  const password = getEnvValue("VITE_AUTH_PASSWORD")

  if (!username || !password) {
    return null
  }

  try {
    const response = await axios.post(`${getApiUrl()}/autenticacao/login`, {
      username,
      password,
    })

    const token = response.data?.access_token || response.data?.token

    if (token) {
      tokenManager.setToken(token)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      return token
    }

    return null
  } catch {
    return null
  }
}

const ensureAuthentication = async (): Promise<void> => {
  const token = tokenManager.getToken()

  if (token) {
    return
  }

  if (authPromise) {
    return authPromise
  }

  authPromise = (async () => {
    const newToken = await attemptReAuthentication()

    if (!newToken) {
      authPromise = null
      redirectToLogin()
      throw new Error("Autenticação necessária")
    }

    authPromise = null
  })()

  return authPromise
}

const redirectToLogin = () => {
  if (!window.location.pathname.includes("/login")) {
    if (redirectOverride) {
      redirectOverride("/login")
      return
    }

    try {
      window.location.href = "/login"
    } catch {
      return
    }
  }
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    await ensureAuthentication()
  } catch (error) {
    return Promise.reject(error)
  }

  const token = tokenManager.getToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      cleanupAuth()

      const newToken = await attemptReAuthentication()

      if (newToken) {
        setAuthHeader(originalRequest, newToken)
        originalRequest._retry = false
        return api(originalRequest)
      }

      redirectToLogin()
      return Promise.reject(createAuthError())
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          request: originalRequest,
          resolve: (token: string) => {
            setAuthHeader(originalRequest, token)
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const token = tokenManager.getToken()

      if (!token) {
        const newToken = await attemptReAuthentication()

        if (newToken) {
          resolveQueuedRequests(newToken)
          setAuthHeader(originalRequest, newToken)
          return api(originalRequest)
        }

        redirectToLogin()
        throw new Error("Autenticação necessária")
      }

      const response = await refreshApi.put(
        "/autenticacao/refresh",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      const newToken = getTokenFromResponse(response.data)

      if (newToken) {
        tokenManager.setToken(newToken)
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
        resolveQueuedRequests(newToken)
        setAuthHeader(originalRequest, newToken)
        return api(originalRequest)
      }

      throw new Error("Falha ao renovar token - sem token na resposta")
    } catch (refreshError) {
      rejectQueuedRequests(refreshError)
      cleanupAuth()

      const newToken = await attemptReAuthentication()

      if (newToken) {
        setAuthHeader(originalRequest, newToken)
        originalRequest._retry = false
        return api(originalRequest)
      }

      redirectToLogin()
      return Promise.reject(createAuthError())
    } finally {
      isRefreshing = false
    }
  },
)
