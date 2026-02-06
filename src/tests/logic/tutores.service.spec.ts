import { describe, it, expect, vi, beforeEach } from "vitest"
import { TutoresService } from "../../app/features/tutores/api/tutores.service"
import { httpClient } from "../../app/core/api/api.client"

vi.mock("../../app/core/api/api.client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  API_ENDPOINTS: {
    tutores: {
      base: "/v1/tutores",
      byId: (id: number) => `/v1/tutores/${id}`,
      photos: (id: number) => `/v1/tutores/${id}/fotos`,
      photoById: (id: number, photoId: number) =>
        `/v1/tutores/${id}/fotos/${photoId}`,
      linkPet: (tutorId: number, petId: number) =>
        `/v1/tutores/${tutorId}/pets/${petId}`,
    },
  },
}))

describe("TutoresService", () => {
  let service: TutoresService

  beforeEach(() => {
    service = new TutoresService()
    vi.clearAllMocks()
  })

  describe("getAll()", () => {
    it("deve buscar todos os tutores com paginação padrão", async () => {
      const mockResponse = {
        data: {
          content: [
            {
              id: 1,
              nome: "João Silva",
              email: "joao@example.com",
              cpf: 12345678901,
              telefone: "123456789",
              endereco: "Rua A",
            },
          ],
          page: 0,
          size: 10,
          total: 1,
        },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      const result = await service.getAll()

      expect(httpClient.get).toHaveBeenCalledWith("/v1/tutores", {
        params: { page: 0, size: 10 },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it("deve buscar tutores com página e tamanho personalizados", async () => {
      const mockResponse = {
        data: {
          content: [
            {
              id: 2,
              nome: "Maria Santos",
              email: "maria@example.com",
              cpf: 10987654321,
              telefone: "987654321",
              endereco: "Rua B",
            },
          ],
          page: 2,
          size: 20,
          total: 50,
        },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      await service.getAll(3, "", 20)

      expect(httpClient.get).toHaveBeenCalledWith("/v1/tutores", {
        params: { page: 2, size: 20 },
      })
    })

    it("deve incluir filtro de nome quando fornecido", async () => {
      const mockResponse = {
        data: { content: [], page: 0, size: 10, total: 0 },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      await service.getAll(1, "Maria", 10)

      expect(httpClient.get).toHaveBeenCalledWith("/v1/tutores", {
        params: { page: 0, size: 10, nome: "Maria" },
      })
    })

    it("deve tratar números de página negativos", async () => {
      const mockResponse = {
        data: { content: [], page: 0, size: 10, total: 0 },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      await service.getAll(-3, "", 10)

      expect(httpClient.get).toHaveBeenCalledWith("/v1/tutores", {
        params: { page: 0, size: 10 },
      })
    })
  })

  describe("getById()", () => {
    it("deve buscar tutor por id", async () => {
      const mockTutor = {
        id: 1,
        nome: "João Silva",
        email: "joao@example.com",
        cpf: 12345678901,
        telefone: "123456789",
        endereco: "Rua A, 123",
        pets: [],
      }
      vi.mocked(httpClient.get).mockResolvedValue({ data: mockTutor })

      const result = await service.getById(1)

      expect(httpClient.get).toHaveBeenCalledWith("/v1/tutores/1")
      expect(result).toEqual(mockTutor)
    })

    it("deve retornar null para tutor inexistente", async () => {
      vi.mocked(httpClient.get).mockResolvedValue({ data: null })

      const result = await service.getById(999)

      expect(result).toBeNull()
    })

    it("deve lançar erro em falha de rede", async () => {
      vi.mocked(httpClient.get).mockRejectedValue(new Error("Erro de rede"))

      await expect(service.getById(1)).rejects.toThrow("Erro de rede")
    })
  })

  describe("create()", () => {
    it("deve criar um novo tutor", async () => {
      const formData = {
        nome: "Ana Costa",
        email: "ana@example.com",
        cpf: 10203040506,
        telefone: "11999999999",
        endereco: "Av. Central, 500",
      }
      const mockResponse = { data: { id: 10, ...formData } }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.create(formData)

      expect(httpClient.post).toHaveBeenCalledWith("/v1/tutores", formData)
      expect(result).toEqual(mockResponse.data)
    })

    it("deve lançar erro em falha de validação", async () => {
      const formData = { nome: "", telefone: "123", endereco: "Rua X" }
      const error = {
        response: { status: 400, data: { message: "Dados inválidos" } },
      }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.create(formData)).rejects.toEqual(error)
    })
  })

  describe("update()", () => {
    it("deve atualizar um tutor existente", async () => {
      const formData = {
        nome: "João Silva Updated",
        email: "joao.updated@example.com",
        cpf: 12345678901,
        telefone: "11988888888",
        endereco: "Rua A, 456",
      }
      const mockResponse = { data: { id: 1, ...formData } }
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse)

      const result = await service.update(1, formData)

      expect(httpClient.put).toHaveBeenCalledWith("/v1/tutores/1", formData)
      expect(result).toEqual(mockResponse.data)
    })

    it("deve lançar erro para tutor inexistente", async () => {
      const formData = {
        nome: "Ghost User",
        telefone: "11977777777",
        endereco: "Nowhere",
      }
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.put).mockRejectedValue(error)

      await expect(service.update(999, formData)).rejects.toEqual(error)
    })
  })

  describe("remove()", () => {
    it("deve deletar um tutor", async () => {
      vi.mocked(httpClient.delete).mockResolvedValue({ data: null })

      await service.remove(1)

      expect(httpClient.delete).toHaveBeenCalledWith("/v1/tutores/1")
    })

    it("deve lançar erro em falha na exclusão", async () => {
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.remove(999)).rejects.toEqual(error)
    })
  })

  describe("uploadPhoto()", () => {
    it("deve fazer upload de foto com sucesso", async () => {
      const mockFile = new File(["photo"], "tutor.jpg", { type: "image/jpeg" })
      const mockResponse = { data: { url: "https://example.com/tutor.jpg" } }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.uploadPhoto(1, mockFile)

      expect(httpClient.post).toHaveBeenCalledWith(
        "/v1/tutores/1/fotos",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      expect(result).toEqual(mockResponse.data)
    })

    it("deve lançar erro em falha no upload", async () => {
      const mockFile = new File(["photo"], "tutor.jpg", { type: "image/jpeg" })
      const error = {
        response: { status: 413, data: { message: "Arquivo muito grande" } },
      }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.uploadPhoto(1, mockFile)).rejects.toEqual(error)
    })
  })

  describe("linkPet()", () => {
    it("deve vincular pet ao tutor com sucesso", async () => {
      vi.mocked(httpClient.post).mockResolvedValue({ data: null })

      await service.linkPet(1, 5)

      expect(httpClient.post).toHaveBeenCalledWith("/v1/tutores/1/pets/5")
    })

    it("deve lançar erro em falha de vinculação", async () => {
      const error = {
        response: { status: 404, data: { message: "Pet não encontrado" } },
      }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.linkPet(1, 999)).rejects.toEqual(error)
    })

    it("deve lançar erro se o pet já estiver vinculado", async () => {
      const error = {
        response: { status: 409, data: { message: "Pet já vinculado" } },
      }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.linkPet(1, 5)).rejects.toEqual(error)
    })
  })

  describe("unlinkPet()", () => {
    it("deve desvincular pet do tutor com sucesso", async () => {
      vi.mocked(httpClient.delete).mockResolvedValue({ data: null })

      await service.unlinkPet(1, 5)

      expect(httpClient.delete).toHaveBeenCalledWith("/v1/tutores/1/pets/5")
    })

    it("deve lançar erro em falha na desvinculação", async () => {
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.unlinkPet(1, 999)).rejects.toEqual(error)
    })

    it("deve lançar erro se o vínculo não existir", async () => {
      const error = {
        response: { status: 404, data: { message: "Link não encontrado" } },
      }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.unlinkPet(1, 10)).rejects.toEqual(error)
    })
  })

  describe("deletePhoto()", () => {
    it("deve deletar foto com sucesso", async () => {
      vi.mocked(httpClient.delete).mockResolvedValue({ data: null })

      await service.deletePhoto(1, 3)

      expect(httpClient.delete).toHaveBeenCalledWith("/v1/tutores/1/fotos/3")
    })

    it("deve lançar erro em falha na exclusão de foto", async () => {
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.deletePhoto(1, 999)).rejects.toEqual(error)
    })
  })
})
