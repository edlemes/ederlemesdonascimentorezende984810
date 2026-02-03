import { httpClient, API_ENDPOINTS } from '../../../core/api/api.client'
import type { PaginatedResponse, RemoteImage } from '../../../core/api/api-types'
import type { Pet, PetFormData } from '../models/pet.model'

export type RemotePet = Pet & {
  tutorId?: number
  foto?: RemoteImage
  fotoUrl?: string
}

export type RemotePetsResponse = PaginatedResponse<RemotePet>

export class PetsService {
  async getAll(page = 1, nome = '', size = 10): Promise<RemotePetsResponse> {
    const params: { page: number; size: number; nome?: string } = {
      page: Math.max(0, page - 1),
      size,
    }
    if (nome) params.nome = nome
    const res = await httpClient.get(API_ENDPOINTS.pets.base, { params })
    return res.data
  }

  async getById(id: number): Promise<RemotePet | null> {
    const res = await httpClient.get(API_ENDPOINTS.pets.byId(id))
    return res.data
  }

  async create(data: PetFormData): Promise<Pet> {
    const res = await httpClient.post(API_ENDPOINTS.pets.base, data)
    return res.data
  }

  async update(id: number, data: PetFormData): Promise<Pet> {
    const res = await httpClient.put(API_ENDPOINTS.pets.byId(id), data)
    return res.data
  }

  async remove(id: number): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.pets.byId(id))
  }

  async uploadPhoto(id: number, file: File): Promise<unknown> {
    const fd = new FormData()
    fd.append('foto', file)
    const res = await httpClient.post(API_ENDPOINTS.pets.photos(id), fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }

  async deletePhoto(id: number, photoId: number): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.pets.photoById(id, photoId))
  }

}

export const petsService = new PetsService()


