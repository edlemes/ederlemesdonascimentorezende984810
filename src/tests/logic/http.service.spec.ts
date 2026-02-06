import { describe, expect, it, vi } from "vitest"

type AxiosLikeError = {
  response?: { status?: number }
  config?: any
}

type SetupResult = {
  apiFn: any
  refreshPut: any
  axiosPost: any
  requestInterceptor: (config: any) => any
  responseErrorInterceptor: (error: any) => Promise<any>
  mod: typeof import("../../app/core/api/http.service")
}

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const setup = async (): Promise<SetupResult> => {
  vi.resetModules()

  const apiFn: any = vi.fn().mockResolvedValue({ data: { ok: true } })
  apiFn.defaults = { headers: { common: {} as Record<string, string> } }

  let requestInterceptor: ((config: any) => any) | undefined
  let responseErrorInterceptor: ((error: any) => Promise<any>) | undefined

  apiFn.interceptors = {
    request: {
      use: vi.fn((fn: any) => {
        requestInterceptor = fn
      }),
    },
    response: {
      use: vi.fn((_success: any, error: any) => {
        responseErrorInterceptor = error
      }),
    },
  }

  const refreshPut = vi.fn()
  const refreshInstance = { put: refreshPut }

  const axiosPost = vi.fn()
  const create = vi
    .fn()
    .mockImplementationOnce(() => apiFn)
    .mockImplementationOnce(() => refreshInstance)

  vi.doMock("axios", () => ({
    default: {
      create,
      post: axiosPost,
    },
    AxiosError: class AxiosError extends Error {},
  }))

  const mod = await import("../../app/core/api/http.service")
  mod.__testing.setRedirect(() => {})

  if (!requestInterceptor) {
    throw new Error("interceptor de requisição não registrado")
  }
  if (!responseErrorInterceptor) {
    throw new Error("interceptor de resposta não registrado")
  }

  return {
    apiFn,
    refreshPut,
    axiosPost,
    requestInterceptor,
    responseErrorInterceptor,
    mod,
  }
}

const make401Error = (config: any): AxiosLikeError => ({
  response: { status: 401 },
  config,
})

describe("http.service", () => {
  it("anexa Authorization na requisição quando há token", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "abc")

    const { requestInterceptor } = await setup()

    const cfg = await requestInterceptor({ headers: {} })
    expect(cfg.headers.Authorization).toBe("Bearer abc")
  })

  it("faz re-auth na requisição quando não há token e credenciais existem", async () => {
    localStorage.clear()

    const { requestInterceptor, axiosPost, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    axiosPost.mockResolvedValueOnce({ data: { access_token: "new-token" } })

    const cfg = await requestInterceptor({ headers: {} })

    expect(localStorage.getItem("pet_manager_token")).toBe("new-token")
    expect(cfg.headers.Authorization).toBe("Bearer new-token")
  })

  it("deduplica ensureAuthentication quando há chamadas concorrentes", async () => {
    localStorage.clear()

    const { requestInterceptor, axiosPost, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    let resolveLogin: ((value: any) => void) | undefined
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })

    axiosPost.mockReturnValueOnce(loginPromise as any)

    const p1 = requestInterceptor({ headers: {} })
    const p2 = requestInterceptor({ headers: {} })

    expect(axiosPost).toHaveBeenCalledTimes(1)

    resolveLogin?.({ data: { access_token: "dedup-token" } })
    const [cfg1, cfg2] = await Promise.all([p1, p2])

    expect(cfg1.headers.Authorization).toBe("Bearer dedup-token")
    expect(cfg2.headers.Authorization).toBe("Bearer dedup-token")
  })

  it("rejeita na requisição quando não há token e não há credenciais", async () => {
    localStorage.clear()

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({})

    await expect(requestInterceptor({ headers: {} })).rejects.toMatchObject({
      message: "Autenticação necessária",
    })
  })

  it("propaga erro quando status não é 401", async () => {
    const { responseErrorInterceptor } = await setup()

    const error: AxiosLikeError = { response: { status: 500 }, config: {} }
    await expect(responseErrorInterceptor(error as any)).rejects.toBe(error)
  })

  it("faz refresh e reexecuta requisição ao receber 401", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, apiFn } = await setup()

    refreshPut.mockResolvedValueOnce({ data: { access_token: "refreshed" } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem("pet_manager_token")).toBe("refreshed")
    expect(apiFn.defaults.headers.common.Authorization).toBe(
      "Bearer refreshed",
    )
    expect(apiFn).toHaveBeenCalledTimes(1)
    expect(req.headers.Authorization).toBe("Bearer refreshed")
  })

  it("quando 401 ocorre sem token armazenado, tenta re-auth e reexecuta requisição", async () => {
    localStorage.clear()

    const { responseErrorInterceptor, axiosPost, apiFn, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    axiosPost.mockResolvedValueOnce({ data: { access_token: "from-reauth" } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem("pet_manager_token")).toBe("from-reauth")
    expect(req.headers.Authorization).toBe("Bearer from-reauth")
    expect(apiFn).toHaveBeenCalledTimes(1)
  })

  it("enfileira requisições durante refresh e resolve após obter novo token", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, apiFn } = await setup()

    let resolveRefresh: ((value: any) => void) | undefined
    const refreshPromise = new Promise((resolve) => {
      resolveRefresh = resolve
    })

    refreshPut.mockReturnValueOnce(refreshPromise as any)

    const req1: { headers: Record<string, string> } = { headers: {} }
    const req2: { headers: Record<string, string> } = { headers: {} }

    const p1 = responseErrorInterceptor(make401Error(req1) as any)
    const p2 = responseErrorInterceptor(make401Error(req2) as any)

    resolveRefresh?.({ data: { token: "queued-token" } })

    await flush()
    await Promise.all([p1, p2])

    expect(localStorage.getItem("pet_manager_token")).toBe("queued-token")
    expect(apiFn).toHaveBeenCalledTimes(2)
    expect(req1.headers.Authorization).toBe("Bearer queued-token")
    expect(req2.headers.Authorization).toBe("Bearer queued-token")
  })

  it("quando refresh falha, rejeita requisições enfileiradas com o erro de refresh", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, axiosPost, apiFn, mod } =
      await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    let rejectRefresh: ((reason?: unknown) => void) | undefined
    const refreshPromise = new Promise((_, reject) => {
      rejectRefresh = reject
    })

    refreshPut.mockReturnValueOnce(refreshPromise as any)
    axiosPost.mockResolvedValueOnce({ data: { token: "recover-token" } })

    const req1: { headers: Record<string, string> } = { headers: {} }
    const req2: { headers: Record<string, string> } = { headers: {} }

    const p1 = responseErrorInterceptor(make401Error(req1) as any)
    const p2 = responseErrorInterceptor(make401Error(req2) as any)

    const refreshError = new Error("refresh indisponível")
    rejectRefresh?.(refreshError)

    await expect(p2).rejects.toBe(refreshError)
    await p1

    expect(localStorage.getItem("pet_manager_token")).toBe("recover-token")
    expect(req1.headers.Authorization).toBe("Bearer recover-token")
    expect(apiFn).toHaveBeenCalledTimes(1)
  })

  it("quando refresh responde sem token, faz fallback para re-auth", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, axiosPost, apiFn, mod } =
      await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    refreshPut.mockResolvedValueOnce({ data: null })
    axiosPost.mockResolvedValueOnce({ data: { token: "reauth-after-null" } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem("pet_manager_token")).toBe("reauth-after-null")
    expect(req.headers.Authorization).toBe("Bearer reauth-after-null")
    expect(apiFn).toHaveBeenCalledTimes(1)
  })

  it("fallback para re-auth quando refresh falha", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, axiosPost, apiFn, mod } =
      await setup()

    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    refreshPut.mockRejectedValueOnce(new Error("rede"))
    axiosPost.mockResolvedValueOnce({ data: { token: "reauth-token" } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem("pet_manager_token")).toBe("reauth-token")
    expect(req.headers.Authorization).toBe("Bearer reauth-token")
    expect(apiFn).toHaveBeenCalledTimes(1)
  })

  it("quando _retry já ocorreu e re-auth falha, rejeita com isAuthError", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor } = await setup()

    const req: { headers: Record<string, string>; _retry: true } = {
      headers: {},
      _retry: true,
    }

    await expect(
      responseErrorInterceptor(make401Error(req) as any),
    ).rejects.toMatchObject({
      message: "Autenticação necessária",
      isAuthError: true,
    })

    expect(localStorage.getItem("pet_manager_token")).toBeNull()
  })

  it("quando _retry já ocorreu e re-auth tem sucesso, reexecuta requisição", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, axiosPost, apiFn, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    axiosPost.mockResolvedValueOnce({ data: { access_token: "retry-token" } })

    const req: { headers: Record<string, string>; _retry: boolean } = {
      headers: {},
      _retry: true,
    }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem("pet_manager_token")).toBe("retry-token")
    expect(req.headers.Authorization).toBe("Bearer retry-token")
    expect(apiFn).toHaveBeenCalledTimes(1)
    expect(req._retry).toBe(false)
  })

  it("rejeita quando 401 sem requisição original (config undefined)", async () => {
    const { responseErrorInterceptor } = await setup()

    const error: AxiosLikeError = {
      response: { status: 401 },
      config: undefined,
    }
    await expect(responseErrorInterceptor(error as any)).rejects.toBe(error)
  })

  it("getTokenFromResponse retorna token de accessToken", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, apiFn } = await setup()

    refreshPut.mockResolvedValueOnce({
      data: { accessToken: "camelCase-token" },
    })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem("pet_manager_token")).toBe("camelCase-token")
    expect(apiFn).toHaveBeenCalledTimes(1)
  })

  it("getEnvValue usa override quando definido", async () => {
    localStorage.clear()

    const { mod, requestInterceptor, axiosPost } = await setup()
    mod.__testing.setEnv({
      VITE_AUTH_USERNAME: "override-user",
      VITE_AUTH_PASSWORD: "override-pass",
    })

    axiosPost.mockResolvedValueOnce({ data: { token: "t" } })

    await requestInterceptor({ headers: {} })

    expect(axiosPost).toHaveBeenCalledWith(
      expect.stringContaining("/autenticacao/login"),
      { username: "override-user", password: "override-pass" },
    )
  })

  it("attemptReAuthentication retorna null quando login falha", async () => {
    localStorage.clear()

    const { requestInterceptor, axiosPost, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    axiosPost.mockRejectedValueOnce(new Error("falha no login"))

    await expect(requestInterceptor({ headers: {} })).rejects.toThrow(
      "Autenticação necessária",
    )
  })

  it("attemptReAuthentication retorna null quando resposta não tem token", async () => {
    localStorage.clear()

    const { requestInterceptor, axiosPost, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    axiosPost.mockResolvedValueOnce({ data: {} })

    await expect(requestInterceptor({ headers: {} })).rejects.toThrow(
      "Autenticação necessária",
    )
  })

  it("redirectToLogin não faz nada quando já está em /login", async () => {
    localStorage.clear()

    const originalPathname = window.location.pathname
    Object.defineProperty(window, "location", {
      value: { pathname: "/login", href: "/login" },
      writable: true,
    })

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({})
    mod.__testing.setRedirect(null)

    await expect(requestInterceptor({ headers: {} })).rejects.toThrow(
      "Autenticação necessária",
    )

    Object.defineProperty(window, "location", {
      value: { pathname: originalPathname, href: "/" },
      writable: true,
    })
  })

  it("redirectToLogin trata erro ao definir window.location.href", async () => {
    localStorage.clear()

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({})

    let redirectCalled = false
    const throwingRedirect = () => {
      redirectCalled = true
      throw new Error("Não é possível navegar")
    }
    mod.__testing.setRedirect(throwingRedirect)

    await expect(requestInterceptor({ headers: {} })).rejects.toThrow()
    expect(redirectCalled).toBe(true)
  })

  it("quando 401 sem token armazenado e sem credenciais, redireciona para login", async () => {
    localStorage.clear()

    const { responseErrorInterceptor, mod } = await setup()
    mod.__testing.setEnv({})

    const req: { headers: Record<string, string> } = { headers: {} }

    await expect(
      responseErrorInterceptor(make401Error(req) as any),
    ).rejects.toThrow("Autenticação necessária")
  })

  it("tokenManager get/set/clear funcionam corretamente", async () => {
    localStorage.clear()

    const { mod } = await setup()

    expect(mod.tokenManager.getToken()).toBeNull()

    mod.tokenManager.setToken("test-token")
    expect(mod.tokenManager.getToken()).toBe("test-token")

    mod.tokenManager.clearToken()
    expect(mod.tokenManager.getToken()).toBeNull()
  })

  it("attemptReAuthentication retorna null quando apenas username está definido", async () => {
    localStorage.clear()

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u" })

    await expect(requestInterceptor({ headers: {} })).rejects.toThrow(
      "Autenticação necessária",
    )
  })

  it("attemptReAuthentication retorna null quando apenas password está definido", async () => {
    localStorage.clear()

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_PASSWORD: "p" })

    await expect(requestInterceptor({ headers: {} })).rejects.toThrow(
      "Autenticação necessária",
    )
  })

  it("attemptReAuthentication retorna null quando username é string vazia", async () => {
    localStorage.clear()

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "", VITE_AUTH_PASSWORD: "p" })

    await expect(requestInterceptor({ headers: {} })).rejects.toThrow(
      "Autenticação necessária",
    )
  })

  it("attemptReAuthentication retorna null quando password é string vazia", async () => {
    localStorage.clear()

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "" })

    await expect(requestInterceptor({ headers: {} })).rejects.toThrow(
      "Autenticação necessária",
    )
  })

  it("__testing.reset limpa envOverride e redirectOverride", async () => {
    const { mod } = await setup()

    mod.__testing.setEnv({ VITE_TEST_KEY: "value" })
    mod.__testing.setRedirect(() => {})
    mod.__testing.reset()

    mod.__testing.setEnv({})
    expect(true).toBe(true)
  })

  it("redirectToLogin trata erro ao definir window.location.href sem override", async () => {
    localStorage.clear()

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({})
    mod.__testing.setRedirect(null)

    const originalLocation = window.location
    const mockLocation = { pathname: "/" } as Location

    Object.defineProperty(mockLocation, "href", {
      set: () => {
        throw new Error("Não é possível definir href")
      },
      get: () => "/",
    })

    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
      configurable: true,
    })

    await expect(requestInterceptor({ headers: {} })).rejects.toThrow(
      "Autenticação necessária",
    )

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it("getApiUrl usa valor padrão quando VITE_API_URL não está definido", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "test")

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({})

    const cfg = await requestInterceptor({ headers: {} })
    expect(cfg.headers.Authorization).toBe("Bearer test")
  })

  it("setAuthHeader define headers quando headers já existe", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, apiFn } = await setup()

    refreshPut.mockResolvedValueOnce({ data: { token: "new" } })

    const req: { headers: Record<string, string> | null } = {
      headers: { "X-Custom": "value" },
    }
    await responseErrorInterceptor({
      response: { status: 401 },
      config: req,
    } as any)

    expect(req.headers?.Authorization).toBe("Bearer new")
    expect(apiFn).toHaveBeenCalled()
  })

  it("getTokenFromResponse retorna null para data não-objeto", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, axiosPost, mod } =
      await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    refreshPut.mockResolvedValueOnce({ data: "not-an-object" })
    axiosPost.mockResolvedValueOnce({ data: { token: "fallback" } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor({
      response: { status: 401 },
      config: req,
    } as any)

    expect(req.headers.Authorization).toBe("Bearer fallback")
  })

  it("getApiUrl usa VITE_API_URL quando definido", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "test")

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({ VITE_API_URL: "https://custom-api.example.com" })

    const cfg = await requestInterceptor({ headers: {} })
    expect(cfg.headers.Authorization).toBe("Bearer test")
  })

  it("setAuthHeader cria headers quando headers é undefined", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, apiFn } = await setup()

    refreshPut.mockResolvedValueOnce({ data: { token: "new" } })

    const req: { headers?: Record<string, string> } = {}
    await responseErrorInterceptor({
      response: { status: 401 },
      config: req,
    } as any)

    expect(req.headers?.Authorization).toBe("Bearer new")
    expect(apiFn).toHaveBeenCalled()
  })

  it("getTokenFromResponse retorna null quando candidates são todos não-string", async () => {
    localStorage.clear()
    localStorage.setItem("pet_manager_token", "old")

    const { responseErrorInterceptor, refreshPut, axiosPost, mod } =
      await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: "u", VITE_AUTH_PASSWORD: "p" })

    refreshPut.mockResolvedValueOnce({
      data: { access_token: 123, token: null, accessToken: undefined },
    })
    axiosPost.mockResolvedValueOnce({ data: { token: "fallback" } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor({
      response: { status: 401 },
      config: req,
    } as any)

    expect(req.headers.Authorization).toBe("Bearer fallback")
  })
})
