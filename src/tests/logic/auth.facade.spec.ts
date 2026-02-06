import { describe, it, expect, vi, beforeEach } from "vitest"
import { AuthFacade } from "../../app/features/auth/facades/auth.facade"
import type { EnvReader } from "../../app/features/auth/facades/auth.facade"
import type { AuthService } from "../../app/features/auth/api/auth.service"
import type { TokenManager } from "../../app/core/api/api-types"

describe("AuthFacade", () => {
  let facade: AuthFacade
  let mockAuthService: AuthService
  let mockTokenManager: TokenManager
  let envReader: EnvReader

  beforeEach(() => {
    vi.clearAllMocks()

    envReader = vi.fn().mockReturnValue(undefined)

    mockAuthService = {
      login: vi.fn(),
      refresh: vi
        .fn()
        .mockResolvedValue({ token: "refreshed-token", user: undefined }),
      logout: vi.fn(),
    } as any

    mockTokenManager = {
      getToken: vi.fn().mockReturnValue(null),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    facade = new AuthFacade(mockAuthService, mockTokenManager, envReader)
  })

  it("autentica usuário e atualiza observables", async () => {
    const authStates: boolean[] = []
    const sub = facade.isAuthenticated$.subscribe((val) =>
      authStates.push(val),
    )

    vi.mocked(mockAuthService.login).mockResolvedValue({
      token: "test-token-123",
      user: { id: 1, nome: "Admin User", email: "admin@example.com" },
    })

    await facade.login({ username: "admin", password: "admin" })

    sub.unsubscribe()

    expect(authStates.at(-1)).toBe(true)
    expect(mockAuthService.login).toHaveBeenCalledWith({
      username: "admin",
      password: "admin",
    })
    expect(mockTokenManager.setToken).toHaveBeenCalledWith("test-token-123")

    let currentToken: string | null = null
    facade.token$.subscribe((val) => (currentToken = val))
    expect(currentToken).toBe("test-token-123")
  })

  it("restaura sessão do localStorage", () => {
    vi.mocked(mockAuthService.refresh).mockResolvedValue({
      token: "stored-token",
      user: { id: 1, nome: "Stored User", email: "stored@example.com" },
    })

    const mockTokenMgrWithToken: TokenManager = {
      getToken: vi.fn().mockReturnValue("stored-token"),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    const newFacade = new AuthFacade(
      mockAuthService,
      mockTokenMgrWithToken,
      envReader,
    )

    let isAuthenticated = false
    newFacade.isAuthenticated$.subscribe((val) => (isAuthenticated = val))

    expect(isAuthenticated).toBe(true)
  })

  it("trata falha de login e atualiza observables", async () => {
    const authStates: boolean[] = []
    const sub = facade.isAuthenticated$.subscribe((val) =>
      authStates.push(val),
    )

    vi.mocked(mockAuthService.login).mockRejectedValue(
      new Error("Invalid credentials"),
    )

    await expect(
      facade.login({ username: "wrong", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials")

    sub.unsubscribe()

    expect(authStates.at(-1)).toBe(false)

    let currentToken: string | null = "should be null"
    facade.token$.subscribe((val) => (currentToken = val))
    expect(currentToken).toBeNull()
  })

  it("seta isLoading durante requisição de login", async () => {
    const loadingStates: boolean[] = []
    const sub = facade.isLoading$.subscribe((val) => loadingStates.push(val))

    vi.mocked(mockAuthService.login).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ token: "token", user: undefined }), 10),
        ),
    )

    const promise = facade.login({ username: "test", password: "test" })

    expect(loadingStates).toContain(true)

    await promise
    sub.unsubscribe()

    expect(loadingStates.at(-1)).toBe(false)
  })

  it("autoLogin tenta login com credenciais do env", async () => {
    const localEnvReader: EnvReader = (key: string) =>
      ({ VITE_AUTH_USERNAME: "auto-user", VITE_AUTH_PASSWORD: "auto-pass" })[
        key
      ]

    const localFacade = new AuthFacade(
      mockAuthService,
      mockTokenManager,
      localEnvReader,
    )

    vi.mocked(mockAuthService.login).mockResolvedValue({
      token: "auto-token",
      user: { id: 99, nome: "Auto User", email: "auto@test.com" },
    })

    await localFacade.autoLogin()

    expect(mockAuthService.login).toHaveBeenCalledWith({
      username: "auto-user",
      password: "auto-pass",
    })
  })

  it("autoLogin pula se já está autenticado", async () => {
    const mockTokenMgrAuth: TokenManager = {
      getToken: vi.fn().mockReturnValue("existing-token"),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }
    const authenticatedFacade = new AuthFacade(
      mockAuthService,
      mockTokenMgrAuth,
      envReader,
    )

    await authenticatedFacade.autoLogin()

    expect(mockAuthService.login).not.toHaveBeenCalled()
  })

  it("autoLogin não faz nada sem credenciais do env", async () => {
    await facade.autoLogin()

    expect(mockAuthService.login).not.toHaveBeenCalled()
  })

  it("logout limpa estado de autenticação", () => {
    const authStates: boolean[] = []
    const tokenStates: (string | null)[] = []

    const subAuth = facade.isAuthenticated$.subscribe((val) =>
      authStates.push(val),
    )
    const subToken = facade.token$.subscribe((val) => tokenStates.push(val))

    facade.logout()

    subAuth.unsubscribe()
    subToken.unsubscribe()

    expect(mockAuthService.logout).toHaveBeenCalled()
    expect(mockTokenManager.clearToken).toHaveBeenCalled()
    expect(authStates.at(-1)).toBe(false)
    expect(tokenStates.at(-1)).toBeNull()
  })

  it("getToken retorna valor atual do token", () => {
    expect(facade.getToken()).toBeNull()

    vi.mocked(mockAuthService.login).mockResolvedValue({
      token: "new-token-456",
      user: undefined,
    })

    facade.login({ username: "test", password: "test" }).then(() => {
      expect(facade.getToken()).toBe("new-token-456")
    })
  })

  it("armazena dados do usuário após login com sucesso", async () => {
    const userStates: any[] = []
    const sub = facade.user$.subscribe((val) => userStates.push(val))

    const mockUser = { id: 10, nome: "Test User", email: "test@example.com" }
    vi.mocked(mockAuthService.login).mockResolvedValue({
      token: "token-with-user",
      user: mockUser,
    })

    await facade.login({ username: "test", password: "test" })

    sub.unsubscribe()

    expect(userStates.at(-1)).toEqual(mockUser)
  })

  it("limpa dados do usuário no logout", () => {
    const userStates: any[] = []
    const sub = facade.user$.subscribe((val) => userStates.push(val))

    facade.logout()

    sub.unsubscribe()

    expect(userStates.at(-1)).toBeNull()
  })

  it("limpa sessão ao restaurar token expirado", () => {
    const expiredPayload = btoa(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }),
    )
    const expiredToken = `header.${expiredPayload}.signature`

    const mockTokenMgrWithExpiredToken: TokenManager = {
      getToken: vi.fn().mockReturnValue(expiredToken),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    const newFacade = new AuthFacade(
      mockAuthService,
      mockTokenMgrWithExpiredToken,
      envReader,
    )

    let isAuthenticated = true
    newFacade.isAuthenticated$.subscribe((val) => (isAuthenticated = val))

    expect(isAuthenticated).toBe(false)
    expect(mockTokenMgrWithExpiredToken.clearToken).toHaveBeenCalled()
  })

  it("trata erro de refresh e limpa sessão", async () => {
    vi.mocked(mockAuthService.refresh).mockRejectedValue(
      new Error("Refresh failed"),
    )

    const mockTokenMgrWithToken: TokenManager = {
      getToken: vi.fn().mockReturnValue("valid-token-format"),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    new AuthFacade(mockAuthService, mockTokenMgrWithToken, envReader)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockTokenMgrWithToken.clearToken).toHaveBeenCalled()
  })

  it("trata refresh retornando token nulo", async () => {
    vi.mocked(mockAuthService.refresh).mockResolvedValue({
      token: "",
      user: undefined,
    } as any)

    const mockTokenMgrWithToken: TokenManager = {
      getToken: vi.fn().mockReturnValue("valid-token-format"),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    new AuthFacade(mockAuthService, mockTokenMgrWithToken, envReader)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockTokenMgrWithToken.clearToken).toHaveBeenCalled()
  })

  it("trata token com menos de 2 partes", () => {
    const invalidToken = "single-part-token"

    const mockTokenMgrWithInvalidToken: TokenManager = {
      getToken: vi.fn().mockReturnValue(invalidToken),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    const newFacade = new AuthFacade(
      mockAuthService,
      mockTokenMgrWithInvalidToken,
      envReader,
    )

    let isAuthenticated = false
    newFacade.isAuthenticated$.subscribe((val) => (isAuthenticated = val))

    expect(isAuthenticated).toBe(true)
  })

  it("trata token com payload base64 inválido (JSON inválido)", () => {
    const invalidB64 = btoa("not-valid-json")
    const tokenWithInvalidJson = `header.${invalidB64}.signature`

    const mockTokenMgrWithBadJson: TokenManager = {
      getToken: vi.fn().mockReturnValue(tokenWithInvalidJson),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    const newFacade = new AuthFacade(
      mockAuthService,
      mockTokenMgrWithBadJson,
      envReader,
    )

    let isAuthenticated = false
    newFacade.isAuthenticated$.subscribe((val) => (isAuthenticated = val))

    expect(isAuthenticated).toBe(true)
  })

  it("trata token com exp não-numérico", () => {
    const payloadWithStringExp = btoa(JSON.stringify({ exp: "not-a-number" }))
    const tokenWithStringExp = `header.${payloadWithStringExp}.signature`

    const mockTokenMgrWithStringExp: TokenManager = {
      getToken: vi.fn().mockReturnValue(tokenWithStringExp),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    const newFacade = new AuthFacade(
      mockAuthService,
      mockTokenMgrWithStringExp,
      envReader,
    )

    let isAuthenticated = false
    newFacade.isAuthenticated$.subscribe((val) => (isAuthenticated = val))

    expect(isAuthenticated).toBe(true)
  })

  it("trata token sem exp", () => {
    const payloadWithoutExp = btoa(JSON.stringify({ sub: "user123" }))
    const tokenWithoutExp = `header.${payloadWithoutExp}.signature`

    const mockTokenMgrWithoutExp: TokenManager = {
      getToken: vi.fn().mockReturnValue(tokenWithoutExp),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    const newFacade = new AuthFacade(
      mockAuthService,
      mockTokenMgrWithoutExp,
      envReader,
    )

    let isAuthenticated = false
    newFacade.isAuthenticated$.subscribe((val) => (isAuthenticated = val))

    expect(isAuthenticated).toBe(true)
  })

  it("autoLogin engole erro de login", async () => {
    const localEnvReader: EnvReader = (key: string) =>
      ({ VITE_AUTH_USERNAME: "bad-user", VITE_AUTH_PASSWORD: "bad-pass" })[key]

    const localFacade = new AuthFacade(
      mockAuthService,
      mockTokenManager,
      localEnvReader,
    )

    vi.mocked(mockAuthService.login).mockRejectedValue(
      new Error("Login failed"),
    )

    await localFacade.autoLogin()

    expect(mockAuthService.login).toHaveBeenCalled()
  })

  it("usa defaultEnvReader quando não é fornecido envReader", () => {
    const mockTokenMgrNoToken: TokenManager = {
      getToken: vi.fn().mockReturnValue(null),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }

    const facadeWithDefaultEnv = new AuthFacade(
      mockAuthService,
      mockTokenMgrNoToken,
    )

    let isAuthenticated = false
    facadeWithDefaultEnv.isAuthenticated$.subscribe(
      (val) => (isAuthenticated = val),
    )

    expect(isAuthenticated).toBe(false)
  })
})
