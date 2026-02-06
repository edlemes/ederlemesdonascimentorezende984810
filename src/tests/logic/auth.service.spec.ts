import { describe, it, expect, vi, beforeEach } from "vitest"
import { AuthService } from "../../app/features/auth/api/auth.service"
import { httpClient, tokenManager } from "../../app/core/api/api.client"

vi.mock("../../app/core/api/api.client", () => ({
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
      login: "/autenticacao/login",
      refresh: "/autenticacao/refresh",
    },
  },
}))

describe("AuthService", () => {
  let service: AuthService

  beforeEach(() => {
    service = new AuthService()
    vi.clearAllMocks()
  })

  describe("login()", () => {
    it("deve fazer login com sucesso usando access_token", async () => {
      const mockResponse = {
        data: {
          access_token: "token123",
          user: { id: 1, username: "test" },
        },
      }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.login({
        username: "test",
        password: "pass",
      })

      expect(httpClient.post).toHaveBeenCalledWith("/autenticacao/login", {
        username: "test",
        password: "pass",
      })
      expect(tokenManager.setToken).toHaveBeenCalledWith("token123")
      expect(result).toEqual({
        token: "token123",
        user: { id: 1, username: "test" },
      })
    })

    it("deve fazer login com sucesso usando campo token", async () => {
      const mockResponse = {
        data: {
          token: "altToken456",
          user: { id: 2, username: "user2" },
        },
      }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.login({
        username: "user2",
        password: "pass2",
      })

      expect(tokenManager.setToken).toHaveBeenCalledWith("altToken456")
      expect(result).toEqual({
        token: "altToken456",
        user: { id: 2, username: "user2" },
      })
    })

    it("deve retornar dados brutos se nenhum token for encontrado", async () => {
      const mockResponse = {
        data: { message: "Sem token" },
      }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.login({
        username: "test",
        password: "pass",
      })

      expect(tokenManager.setToken).not.toHaveBeenCalled()
      expect(result).toEqual({ message: "Sem token" })
    })

    it("deve lançar erro em falha de rede", async () => {
      vi.mocked(httpClient.post).mockRejectedValue(new Error("Erro de rede"))

      await expect(
        service.login({ username: "test", password: "pass" }),
      ).rejects.toThrow("Erro de rede")
    })

    it("deve lançar erro em 401 não autorizado", async () => {
      const error = { response: { status: 401 } }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(
        service.login({ username: "wrong", password: "wrong" }),
      ).rejects.toEqual(error)
    })
  })

  describe("refresh()", () => {
    it("deve renovar token com sucesso usando access_token", async () => {
      const mockResponse = {
        data: {
          access_token: "newToken789",
          user: { id: 1, username: "test" },
        },
      }
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse)

      const result = await service.refresh()

      expect(httpClient.put).toHaveBeenCalledWith("/autenticacao/refresh")
      expect(tokenManager.setToken).toHaveBeenCalledWith("newToken789")
      expect(result).toEqual({
        token: "newToken789",
        user: { id: 1, username: "test" },
      })
    })

    it("deve renovar token com sucesso usando campo token", async () => {
      const mockResponse = {
        data: {
          token: "refreshedToken",
          user: { id: 3, username: "user3" },
        },
      }
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse)

      const result = await service.refresh()

      expect(tokenManager.setToken).toHaveBeenCalledWith("refreshedToken")
      expect(result).toEqual({
        token: "refreshedToken",
        user: { id: 3, username: "user3" },
      })
    })

    it("deve retornar dados brutos se nenhum token for encontrado", async () => {
      const mockResponse = {
        data: { error: "Sem token" },
      }
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse)

      const result = await service.refresh()

      expect(tokenManager.setToken).not.toHaveBeenCalled()
      expect(result).toEqual({ error: "Sem token" })
    })

    it("deve lançar erro em falha ao renovar token", async () => {
      vi.mocked(httpClient.put).mockRejectedValue(
        new Error("Falha ao renovar token"),
      )

      await expect(service.refresh()).rejects.toThrow("Falha ao renovar token")
    })

    it("deve lançar erro 401 durante refresh", async () => {
      const error = {
        response: { status: 401, data: { message: "Token inválido" } },
      }
      vi.mocked(httpClient.put).mockRejectedValue(error)

      await expect(service.refresh()).rejects.toEqual(error)
    })
  })

  describe("logout()", () => {
    it("deve limpar token no logout", () => {
      service.logout()

      expect(tokenManager.clearToken).toHaveBeenCalledOnce()
    })

    it("não deve lançar erro no logout", () => {
      expect(() => service.logout()).not.toThrow()
    })
  })
})
