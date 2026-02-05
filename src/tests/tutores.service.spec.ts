import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TutoresService } from '../app/features/tutores/api/tutores.service'
import { httpClient } from '../app/core/api/api.client'

vi.mock('../app/core/api/api.client', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  API_ENDPOINTS: {
    tutores: {
      base: '/v1/tutores',
      byId: (id: number) => `/v1/tutores/${id}`,
      photos: (id: number) => `/v1/tutores/${id}/fotos`,
      photoById: (id: number, photoId: number) => `/v1/tutores/${id}/fotos/${photoId}`,
      linkPet: (tutorId: number, petId: number) => `/v1/tutores/${tutorId}/pets/${petId}`,
    },
  },
}))

describe('TutoresService', () => {
  let service: TutoresService

  beforeEach(() => {
    service = new TutoresService()
    vi.clearAllMocks()
  })

  describe('getAll()', () => {
    it('should fetch all tutores with default pagination', async () => {
      const mockResponse = {
        data: {
          content: [{ id: 1, nome: 'João Silva', email: 'joao@example.com', cpf: 12345678901, telefone: '123456789', endereco: 'Rua A' }],
          page: 0,
          size: 10,
          total: 1,
        },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      const result = await service.getAll()

      expect(httpClient.get).toHaveBeenCalledWith('/v1/tutores', {
        params: { page: 0, size: 10 },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should fetch tutores with custom page and size', async () => {
      const mockResponse = {
        data: {
          content: [{ id: 2, nome: 'Maria Santos', email: 'maria@example.com', cpf: 10987654321, telefone: '987654321', endereco: 'Rua B' }],
          page: 2,
          size: 20,
          total: 50,
        },
      }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      await service.getAll(3, '', 20)

      expect(httpClient.get).toHaveBeenCalledWith('/v1/tutores', {
        params: { page: 2, size: 20 },
      })
    })

    it('should include nome filter when provided', async () => {
      const mockResponse = { data: { content: [], page: 0, size: 10, total: 0 } }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      await service.getAll(1, 'Maria', 10)

      expect(httpClient.get).toHaveBeenCalledWith('/v1/tutores', {
        params: { page: 0, size: 10, nome: 'Maria' },
      })
    })

    it('should handle negative page numbers', async () => {
      const mockResponse = { data: { content: [], page: 0, size: 10, total: 0 } }
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

      await service.getAll(-3, '', 10)

      expect(httpClient.get).toHaveBeenCalledWith('/v1/tutores', {
        params: { page: 0, size: 10 },
      })
    })
  })

  describe('getById()', () => {
    it('should fetch tutor by id', async () => {
      const mockTutor = {
        id: 1,
        nome: 'João Silva',
        email: 'joao@example.com',
        cpf: 12345678901,
        telefone: '123456789',
        endereco: 'Rua A, 123',
        pets: [],
      }
      vi.mocked(httpClient.get).mockResolvedValue({ data: mockTutor })

      const result = await service.getById(1)

      expect(httpClient.get).toHaveBeenCalledWith('/v1/tutores/1')
      expect(result).toEqual(mockTutor)
    })

    it('should return null for non-existent tutor', async () => {
      vi.mocked(httpClient.get).mockResolvedValue({ data: null })

      const result = await service.getById(999)

      expect(result).toBeNull()
    })

    it('should throw error on network failure', async () => {
      vi.mocked(httpClient.get).mockRejectedValue(new Error('Network error'))

      await expect(service.getById(1)).rejects.toThrow('Network error')
    })
  })

  describe('create()', () => {
    it('should create a new tutor', async () => {
      const formData = { nome: 'Ana Costa', email: 'ana@example.com', cpf: 10203040506, telefone: '11999999999', endereco: 'Av. Central, 500' }
      const mockResponse = { data: { id: 10, ...formData } }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.create(formData)

      expect(httpClient.post).toHaveBeenCalledWith('/v1/tutores', formData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error on validation failure', async () => {
      const formData = { nome: '', telefone: '123', endereco: 'Rua X' }
      const error = { response: { status: 400, data: { message: 'Invalid data' } } }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.create(formData)).rejects.toEqual(error)
    })
  })

  describe('update()', () => {
    it('should update an existing tutor', async () => {
      const formData = { nome: 'João Silva Updated', email: 'joao.updated@example.com', cpf: 12345678901, telefone: '11988888888', endereco: 'Rua A, 456' }
      const mockResponse = { data: { id: 1, ...formData } }
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse)

      const result = await service.update(1, formData)

      expect(httpClient.put).toHaveBeenCalledWith('/v1/tutores/1', formData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error for non-existent tutor', async () => {
      const formData = { nome: 'Ghost User', telefone: '11977777777', endereco: 'Nowhere' }
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.put).mockRejectedValue(error)

      await expect(service.update(999, formData)).rejects.toEqual(error)
    })
  })

  describe('remove()', () => {
    it('should delete a tutor', async () => {
      vi.mocked(httpClient.delete).mockResolvedValue({ data: null })

      await service.remove(1)

      expect(httpClient.delete).toHaveBeenCalledWith('/v1/tutores/1')
    })

    it('should throw error on delete failure', async () => {
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.remove(999)).rejects.toEqual(error)
    })
  })

  describe('uploadPhoto()', () => {
    it('should upload photo successfully', async () => {
      const mockFile = new File(['photo'], 'tutor.jpg', { type: 'image/jpeg' })
      const mockResponse = { data: { url: 'https://example.com/tutor.jpg' } }
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse)

      const result = await service.uploadPhoto(1, mockFile)

      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/tutores/1/fotos',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error on upload failure', async () => {
      const mockFile = new File(['photo'], 'tutor.jpg', { type: 'image/jpeg' })
      const error = { response: { status: 413, data: { message: 'File too large' } } }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.uploadPhoto(1, mockFile)).rejects.toEqual(error)
    })
  })

  describe('linkPet()', () => {
    it('should link pet to tutor successfully', async () => {
      vi.mocked(httpClient.post).mockResolvedValue({ data: null })

      await service.linkPet(1, 5)

      expect(httpClient.post).toHaveBeenCalledWith('/v1/tutores/1/pets/5')
    })

    it('should throw error on link failure', async () => {
      const error = { response: { status: 404, data: { message: 'Pet not found' } } }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.linkPet(1, 999)).rejects.toEqual(error)
    })

    it('should throw error if pet already linked', async () => {
      const error = { response: { status: 409, data: { message: 'Pet already linked' } } }
      vi.mocked(httpClient.post).mockRejectedValue(error)

      await expect(service.linkPet(1, 5)).rejects.toEqual(error)
    })
  })

  describe('unlinkPet()', () => {
    it('should unlink pet from tutor successfully', async () => {
      vi.mocked(httpClient.delete).mockResolvedValue({ data: null })

      await service.unlinkPet(1, 5)

      expect(httpClient.delete).toHaveBeenCalledWith('/v1/tutores/1/pets/5')
    })

    it('should throw error on unlink failure', async () => {
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.unlinkPet(1, 999)).rejects.toEqual(error)
    })

    it('should throw error if link does not exist', async () => {
      const error = { response: { status: 404, data: { message: 'Link not found' } } }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.unlinkPet(1, 10)).rejects.toEqual(error)
    })
  })

  describe('deletePhoto()', () => {
    it('should delete photo successfully', async () => {
      vi.mocked(httpClient.delete).mockResolvedValue({ data: null })

      await service.deletePhoto(1, 3)

      expect(httpClient.delete).toHaveBeenCalledWith('/v1/tutores/1/fotos/3')
    })

    it('should throw error on delete photo failure', async () => {
      const error = { response: { status: 404 } }
      vi.mocked(httpClient.delete).mockRejectedValue(error)

      await expect(service.deletePhoto(1, 999)).rejects.toEqual(error)
    })
  })
})
