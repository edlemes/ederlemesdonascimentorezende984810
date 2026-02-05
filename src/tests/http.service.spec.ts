import { describe, expect, it, vi } from 'vitest'

type AxiosLikeError = {
  response?: { status?: number };
  config?: any;
};

type SetupResult = {
  apiFn: any;
  refreshPut: any;
  axiosPost: any;
  requestInterceptor: (config: any) => any;
  responseErrorInterceptor: (error: any) => Promise<any>;
  mod: typeof import('../app/core/api/http.service');
};

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

  vi.doMock('axios', () => ({
    default: {
      create,
      post: axiosPost,
    },
    AxiosError: class AxiosError extends Error {},
  }))

  const mod = await import('../app/core/api/http.service')
  mod.__testing.setRedirect(() => {})

  if (!requestInterceptor) {
    throw new Error('request interceptor not registered')
  }
  if (!responseErrorInterceptor) {
    throw new Error('response interceptor not registered')
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

describe('http.service', () => {
  it('anexa Authorization no request quando há token', async () => {
    localStorage.clear()
    localStorage.setItem('pet_manager_token', 'abc')

    const { requestInterceptor } = await setup()

    const cfg = await requestInterceptor({ headers: {} })
    expect(cfg.headers.Authorization).toBe('Bearer abc')
  })

  it('faz re-auth no request quando não há token e credenciais existem', async () => {
    localStorage.clear()

    const { requestInterceptor, axiosPost, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: 'u', VITE_AUTH_PASSWORD: 'p' })

    axiosPost.mockResolvedValueOnce({ data: { access_token: 'new-token' } })

    const cfg = await requestInterceptor({ headers: {} })

    expect(localStorage.getItem('pet_manager_token')).toBe('new-token')
    expect(cfg.headers.Authorization).toBe('Bearer new-token')
  })

  it('deduplica ensureAuthentication (authPromise) quando há chamadas concorrentes', async () => {
    localStorage.clear()

    const { requestInterceptor, axiosPost, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: 'u', VITE_AUTH_PASSWORD: 'p' })

    let resolveLogin: ((value: any) => void) | undefined
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })

    axiosPost.mockReturnValueOnce(loginPromise as any)

    const p1 = requestInterceptor({ headers: {} })
    const p2 = requestInterceptor({ headers: {} })

    expect(axiosPost).toHaveBeenCalledTimes(1)

    resolveLogin?.({ data: { access_token: 'dedup-token' } })
    const [cfg1, cfg2] = await Promise.all([p1, p2])

    expect(cfg1.headers.Authorization).toBe('Bearer dedup-token')
    expect(cfg2.headers.Authorization).toBe('Bearer dedup-token')
  })

  it('rejeita no request quando não há token e não há credenciais', async () => {
    localStorage.clear()

    const { requestInterceptor, mod } = await setup()
    mod.__testing.setEnv({})

    await expect(requestInterceptor({ headers: {} })).rejects.toMatchObject({
      message: 'Authentication required',
    })
  })

  it('propaga erro quando status != 401', async () => {
    const { responseErrorInterceptor } = await setup()

    const error: AxiosLikeError = { response: { status: 500 }, config: {} }
    await expect(responseErrorInterceptor(error as any)).rejects.toBe(error)
  })

  it('faz refresh e reexecuta request ao receber 401', async () => {
    localStorage.clear()
    localStorage.setItem('pet_manager_token', 'old')

    const { responseErrorInterceptor, refreshPut, apiFn } = await setup()

    refreshPut.mockResolvedValueOnce({ data: { access_token: 'refreshed' } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem('pet_manager_token')).toBe('refreshed')
    expect(apiFn.defaults.headers.common.Authorization).toBe('Bearer refreshed')
    expect(apiFn).toHaveBeenCalledTimes(1)
    expect(req.headers.Authorization).toBe('Bearer refreshed')
  })

  it('quando 401 ocorre sem token armazenado, tenta re-auth e reexecuta request', async () => {
    localStorage.clear()

    const { responseErrorInterceptor, axiosPost, apiFn, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: 'u', VITE_AUTH_PASSWORD: 'p' })

    axiosPost.mockResolvedValueOnce({ data: { access_token: 'from-reauth' } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem('pet_manager_token')).toBe('from-reauth')
    expect(req.headers.Authorization).toBe('Bearer from-reauth')
    expect(apiFn).toHaveBeenCalledTimes(1)
  })

  it('enfileira requests durante refresh e resolve após obter novo token', async () => {
    localStorage.clear()
    localStorage.setItem('pet_manager_token', 'old')

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

    resolveRefresh?.({ data: { token: 'queued-token' } })

    await flush()
    await Promise.all([p1, p2])

    expect(localStorage.getItem('pet_manager_token')).toBe('queued-token')
    expect(apiFn).toHaveBeenCalledTimes(2)
    expect(req1.headers.Authorization).toBe('Bearer queued-token')
    expect(req2.headers.Authorization).toBe('Bearer queued-token')
  })

  it('quando refresh falha, rejeita requests enfileirados com o erro de refresh', async () => {
    localStorage.clear()
    localStorage.setItem('pet_manager_token', 'old')

    const { responseErrorInterceptor, refreshPut, axiosPost, apiFn, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: 'u', VITE_AUTH_PASSWORD: 'p' })

    let rejectRefresh: ((reason?: unknown) => void) | undefined
    const refreshPromise = new Promise((_, reject) => {
      rejectRefresh = reject
    })

    refreshPut.mockReturnValueOnce(refreshPromise as any)
    axiosPost.mockResolvedValueOnce({ data: { token: 'recover-token' } })

    const req1: { headers: Record<string, string> } = { headers: {} }
    const req2: { headers: Record<string, string> } = { headers: {} }

    const p1 = responseErrorInterceptor(make401Error(req1) as any)
    const p2 = responseErrorInterceptor(make401Error(req2) as any)

    const refreshError = new Error('refresh down')
    rejectRefresh?.(refreshError)

    await expect(p2).rejects.toBe(refreshError)
    await p1

    expect(localStorage.getItem('pet_manager_token')).toBe('recover-token')
    expect(req1.headers.Authorization).toBe('Bearer recover-token')
    expect(apiFn).toHaveBeenCalledTimes(1)
  })

  it('quando refresh responde sem token, faz fallback para re-auth', async () => {
    localStorage.clear()
    localStorage.setItem('pet_manager_token', 'old')

    const { responseErrorInterceptor, refreshPut, axiosPost, apiFn, mod } = await setup()
    mod.__testing.setEnv({ VITE_AUTH_USERNAME: 'u', VITE_AUTH_PASSWORD: 'p' })

    refreshPut.mockResolvedValueOnce({ data: null })
    axiosPost.mockResolvedValueOnce({ data: { token: 'reauth-after-null' } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem('pet_manager_token')).toBe('reauth-after-null')
    expect(req.headers.Authorization).toBe('Bearer reauth-after-null')
    expect(apiFn).toHaveBeenCalledTimes(1)
  })

  it('fallback para re-auth quando refresh falha', async () => {
    localStorage.clear()
    localStorage.setItem('pet_manager_token', 'old')

    const { responseErrorInterceptor, refreshPut, axiosPost, apiFn, mod } = await setup()

    mod.__testing.setEnv({ VITE_AUTH_USERNAME: 'u', VITE_AUTH_PASSWORD: 'p' })

    refreshPut.mockRejectedValueOnce(new Error('network'))
    axiosPost.mockResolvedValueOnce({ data: { token: 'reauth-token' } })

    const req: { headers: Record<string, string> } = { headers: {} }
    await responseErrorInterceptor(make401Error(req) as any)

    expect(localStorage.getItem('pet_manager_token')).toBe('reauth-token')
    expect(req.headers.Authorization).toBe('Bearer reauth-token')
    expect(apiFn).toHaveBeenCalledTimes(1)
  })

  it('quando _retry já ocorreu e re-auth falha, rejeita com isAuthError', async () => {
    localStorage.clear()
    localStorage.setItem('pet_manager_token', 'old')

    const { responseErrorInterceptor } = await setup()

    const req: { headers: Record<string, string>; _retry: true } = { headers: {}, _retry: true }

    await expect(responseErrorInterceptor(make401Error(req) as any)).rejects.toMatchObject({
      message: 'Authentication required',
      isAuthError: true,
    })

    expect(localStorage.getItem('pet_manager_token')).toBeNull()
  })
})
