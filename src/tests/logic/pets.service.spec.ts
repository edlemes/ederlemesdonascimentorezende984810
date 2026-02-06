import { describe, it, expect, vi, beforeEach } from "vitest"
import { PetsService } from "../../app/features/pets/api/pets.service"
import { httpClient } from "../../app/core/api/api.client"

vi.mock("../../app/core/api/api.client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  API_ENDPOINTS: {
    pets: {
      base: "/v1/pets",
      byId: (id: number) => `/v1/pets/${id}`,
      photos: (id: number) => `/v1/pets/${id}/fotos`,
      photoById: (id: number, photoId: number) =>
        `/v1/pets/${id}/fotos/${photoId}`,
    },
  },
}))

describe("PetsService", () => {
  let service: PetsService

  beforeEach(() => {
    service = new PetsService()
    vi.clearAllMocks()
  })

  describe("getAll()", () => {
    it("deve buscar todos os pets com paginação padrão", async () => {
      const mockResponse = {
        data: {
          content: [{ id: 1, nome: "Rex" }],
          page: 0,
          size: 10,
          total: 1,
        },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      const result = await service.getAll()

      expect(httpClient.get).toHaveBeenCalledWith("/v1/pets", {
        params: { page: 0, size: 10 },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it("deve buscar pets com página e tamanho personalizados", async () => {
      const mockResponse = {
        data: {
          content: [{ id: 2, nome: "Max" }],
          page: 1,
          size: 5,
          total: 20,
        },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      await service.getAll(2, "", 5)

      expect(httpClient.get).toHaveBeenCalledWith("/v1/pets", {
        params: { page: 1, size: 5 },
      })
    })

    it("deve incluir filtro de nome quando fornecido", async () => {
      const mockResponse = {
        data: { content: [], page: 0, size: 10, total: 0 },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      await service.getAll(1, "Bella", 10)

      expect(httpClient.get).toHaveBeenCalledWith("/v1/pets", {
        params: { page: 0, size: 10, nome: "Bella" },
      })
    })

    it("deve tratar números de página negativos", async () => {
      const mockResponse = {
        data: { content: [], page: 0, size: 10, total: 0 },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      await service.getAll(-5, "", 10)

      expect(httpClient.get).toHaveBeenCalledWith("/v1/pets", {
        params: { page: 0, size: 10 },
      })
    })
  })

  describe("getById()", () => {
    it("deve buscar pet por id", async () => {
      const mockPet = { id: 1, nome: "Rex", especie: "Cachorro", idade: 3 }
      vi.mocked(httpClient.get).mockResolvedValue({ data: mockPet })

      const result = await service.getById(1)

      expect(httpClient.get).toHaveBeenCalledWith("/v1/pets/1")
      expect(result).toEqual(mockPet)
    })

    it("deve retornar null para pet inexistente", async () => {
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
    it("deve criar um novo pet", async () => {
      const formData = {
        nome: "Luna",
        especie: "Gato",
        idade: 2,
        raca: "Siamês",
      }
      const mockResponse = { data: { id: 10, ...formData } }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.create(formData)

      expect(httpClient.post).toHaveBeenCalledWith("/v1/pets", formData)
      expect(result).toEqual(mockResponse.data)
    })

    it("deve lançar erro em falha de validação", async () => {
      const formData = { nome: "", especie: "Gato", idade: 2, raca: "Siamês" }
      const error = {
        response: { status: 400, data: { message: "Dados inválidos" } },
      }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.create(formData)).rejects.toEqual(error)
    })
  })

  describe("update()", () => {
    it("deve atualizar um pet existente", async () => {
      const formData = {
        nome: "Rex Updated",
        especie: "Cachorro",
        idade: 4,
        raca: "Labrador",
      }
      const mockResponse = { data: { id: 1, ...formData } }
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse)

      const result = await service.update(1, formData)

      expect(httpClient.put).toHaveBeenCalledWith("/v1/pets/1", formData)
      expect(result).toEqual(mockResponse.data)
    })

    it("deve lançar erro para pet inexistente", async () => {
      const formData = {
        nome: "Ghost",
        especie: "Cachorro",
        idade: 5,
        raca: "Husky",
      }
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.put).mockRejectedValue(error)

      await expect(service.update(999, formData)).rejects.toEqual(error)
    })
  })

  describe("remove()", () => {
    it("deve deletar um pet", async () => {
      vi.mocked(httpClient.delete).mockResolvedValue({ data: null })

      await service.remove(1)

      expect(httpClient.delete).toHaveBeenCalledWith("/v1/pets/1")
    })

    it("deve lançar erro em falha na exclusão", async () => {
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.remove(999)).rejects.toEqual(error)
    })
  })

  describe("uploadPhoto()", () => {
    it("deve fazer upload de foto com sucesso", async () => {
      const mockFile = new File(["photo"], "pet.jpg", { type: "image/jpeg" })
      const mockResponse = { data: { url: "https://example.com/photo.jpg" } }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.uploadPhoto(1, mockFile)

      expect(httpClient.post).toHaveBeenCalledWith(
        "/v1/pets/1/fotos",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      expect(result).toEqual(mockResponse.data)
    })

    it("deve lançar erro em falha no upload", async () => {
      const mockFile = new File(["photo"], "pet.jpg", { type: "image/jpeg" })
      const error = {
        response: { status: 413, data: { message: "Arquivo muito grande" } },
      }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.uploadPhoto(1, mockFile)).rejects.toEqual(error)
    })
  })

  describe("deletePhoto()", () => {
    it("deve deletar foto com sucesso", async () => {
      vi.mocked(httpClient.delete).mockResolvedValue({ data: null })

      await service.deletePhoto(1, 5)

      expect(httpClient.delete).toHaveBeenCalledWith("/v1/pets/1/fotos/5")
    })

    it("deve lançar erro em falha na exclusão de foto", async () => {
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.deletePhoto(1, 999)).rejects.toEqual(error)
    })
  })
})
