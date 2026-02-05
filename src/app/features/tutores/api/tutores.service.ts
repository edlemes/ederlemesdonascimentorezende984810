import { httpClient, API_ENDPOINTS } from '../../../core/api/api.client'
import type {
  PaginatedResponse,
  RemoteImage,
} from '../../../core/api/api-types'
import type { Tutor, TutorFormData } from '../models/tutor.model'

export type RemoteLinkedPet = {
  id: number
  nome: string
  especie: string
  raca: string
  idade: number
  foto?: RemoteImage
  fotoUrl?: string
}

export type RemoteTutor = {
  id: number
  nome: string
  email?: string
  cpf?: number
  telefone: string
  endereco: string
  foto?: RemoteImage
  fotoUrl?: string
  pets?: RemoteLinkedPet[]
}

export type RemoteTutorsResponse = PaginatedResponse<RemoteTutor>

export class TutoresService {
  async getAll(
    page = 1,
    nome = '',
    size = 10,
  ): Promise<RemoteTutorsResponse> {
    const params: { page: number; size: number; nome?: string } = {
      page: Math.max(0, page - 1),
      size,
    }

    if (nome) params.nome = nome

    const res = await httpClient.get(API_ENDPOINTS.tutores.base, { params })
    return res.data
  }

  async getById(id: number): Promise<RemoteTutor | null> {
    const res = await httpClient.get(API_ENDPOINTS.tutores.byId(id))
    return res.data
  }

  async create(data: TutorFormData): Promise<Tutor> {
    const res = await httpClient.post(API_ENDPOINTS.tutores.base, data)
    return res.data
  }

  async update(id: number, data: TutorFormData): Promise<Tutor> {
    const res = await httpClient.put(API_ENDPOINTS.tutores.byId(id), data)
    return res.data
  }

  async remove(id: number): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.tutores.byId(id))
  }

  async uploadPhoto(id: number, file: File): Promise<unknown> {
    const fd = new FormData()
    fd.append('foto', file)
    const res = await httpClient.post(API_ENDPOINTS.tutores.photos(id), fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }

  async linkPet(tutorId: number, petId: number): Promise<void> {
    await httpClient.post(API_ENDPOINTS.tutores.linkPet(tutorId, petId))
  }

  async unlinkPet(tutorId: number, petId: number): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.tutores.linkPet(tutorId, petId))
  }

  async deletePhoto(id: number, photoId: number): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.tutores.photoById(id, photoId))
  }
}

export const tutoresService = new TutoresService()
