import { BehaviorSubject, Observable } from "rxjs"
import { tutoresService } from "../api/tutores.service"
import type {
  RemoteLinkedPet,
  RemoteTutor,
  RemoteTutorsResponse,
  TutoresService,
} from "../api/tutores.service"
import type { Tutor, TutorFormData } from "../models/tutor.model"

export type LinkedPet = {
  id: number;
  nome: string;
  especie: string;
  raca: string;
  idade: number;
  fotoUrl?: string;
};

type PaginationState = {
  page: number;
  totalPages: number;
  totalElements: number;
};

export class TutoresFacade {
  private _tutores = new BehaviorSubject<Tutor[]>([])
  private _selectedTutor = new BehaviorSubject<Tutor | null>(null)
  private _linkedPets = new BehaviorSubject<LinkedPet[]>([])
  private _isLoading = new BehaviorSubject<boolean>(false)
  private _isSaving = new BehaviorSubject<boolean>(false)
  private _error = new BehaviorSubject<string | null>(null)
  private _pagination = new BehaviorSubject<PaginationState>({
    page: 0,
    totalPages: 0,
    totalElements: 0,
  })

  public readonly tutores$: Observable<Tutor[]> = this._tutores.asObservable()
  public readonly selectedTutor$: Observable<Tutor | null> =
    this._selectedTutor.asObservable()
  public readonly linkedPets$: Observable<LinkedPet[]> =
    this._linkedPets.asObservable()
  public readonly isLoading$: Observable<boolean> =
    this._isLoading.asObservable()
  public readonly isSaving$: Observable<boolean> =
    this._isSaving.asObservable()
  public readonly error$: Observable<string | null> =
    this._error.asObservable()
  public readonly pagination$: Observable<PaginationState> =
    this._pagination.asObservable()

  private tutoresApi: TutoresService

  constructor(tutoresService_?: TutoresService) {
    this.tutoresApi = tutoresService_ ?? tutoresService
  }

  async getAllTutores(page: number, nome = "", size = 10): Promise<void> {
    this._isLoading.next(true)
    this._error.next(null)

    try {
      const response: RemoteTutorsResponse = await this.tutoresApi.getAll(
        page,
        nome,
        size,
      )
      const content: RemoteTutor[] = response.content ?? []
      const tutores = content.map((item) => mapRemoteTutor(item))

      this._tutores.next(tutores)
      this._pagination.next({
        page,
        totalPages: response.pageCount || 0,
        totalElements: response.total || 0,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load tutors"
      this._error.next(message)
      this._tutores.next([])
      this._pagination.next({ page: 0, totalPages: 0, totalElements: 0 })
    } finally {
      this._isLoading.next(false)
    }
  }

  async getTutorById(id: number): Promise<void> {
    this._isLoading.next(true)
    this._error.next(null)

    try {
      const response = await this.tutoresApi.getById(id)
      if (response) {
        const tutor = mapRemoteTutor(response)
        const linkedPets = (response.pets ?? []).map((pet) =>
          mapRemoteLinkedPet(pet),
        )

        this._selectedTutor.next(tutor)
        this._linkedPets.next(linkedPets)
      } else {
        this._selectedTutor.next(null)
        this._linkedPets.next([])
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load tutor"
      this._error.next(message)
      this._selectedTutor.next(null)
      this._linkedPets.next([])
    } finally {
      this._isLoading.next(false)
    }
  }

  async saveTutor(data: TutorFormData): Promise<number> {
    this._isSaving.next(true)
    this._error.next(null)

    try {
      if (data.id) {
        const tutor = await this.tutoresApi.update(data.id, data)
        return tutor.id
      }
      const tutor = await this.tutoresApi.create(data)
      return tutor.id
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save tutor"
      this._error.next(message)
      throw error
    } finally {
      this._isSaving.next(false)
    }
  }

  async deleteTutor(id: number): Promise<void> {
    this._isLoading.next(true)
    this._error.next(null)

    try {
      await this.tutoresApi.remove(id)
      this._tutores.next(
        this._tutores.value.filter((tutor) => tutor.id !== id),
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete tutor"
      this._error.next(message)
      throw error
    } finally {
      this._isLoading.next(false)
    }
  }

  async uploadPhoto(id: number, file: File): Promise<void> {
    this._isSaving.next(true)
    this._error.next(null)

    try {
      await this.tutoresApi.uploadPhoto(id, file)
      await this.getTutorById(id)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload photo"
      this._error.next(message)
      throw error
    } finally {
      this._isSaving.next(false)
    }
  }

  async linkPet(tutorId: number, petId: number): Promise<void> {
    this._isSaving.next(true)
    this._error.next(null)

    try {
      await this.tutoresApi.linkPet(tutorId, petId)
      await this.getTutorById(tutorId)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to link pet"
      this._error.next(message)
      throw error
    } finally {
      this._isSaving.next(false)
    }
  }

  async unlinkPet(tutorId: number, petId: number): Promise<void> {
    this._isSaving.next(true)
    this._error.next(null)

    try {
      await this.tutoresApi.unlinkPet(tutorId, petId)
      this._linkedPets.next(
        this._linkedPets.value.filter((pet) => pet.id !== petId),
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unlink pet"
      this._error.next(message)
      throw error
    } finally {
      this._isSaving.next(false)
    }
  }

  async deletePhoto(id: number, photoId: number): Promise<void> {
    this._isSaving.next(true)
    this._error.next(null)

    try {
      await this.tutoresApi.deletePhoto(id, photoId)
      await this.getTutorById(id)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete photo"
      this._error.next(errorMessage)
      throw error
    } finally {
      this._isSaving.next(false)
    }
  }

  clearSelectedTutor(): void {
    this._selectedTutor.next(null)
    this._linkedPets.next([])
  }

  clearError(): void {
    this._error.next(null)
  }
}

export const tutoresFacade = new TutoresFacade()

const mapRemoteTutor = (remote: RemoteTutor): Tutor => ({
  id: remote.id,
  nome: remote.nome,
  telefone: remote.telefone,
  endereco: remote.endereco,
  fotoUrl: remote.foto?.url || remote.fotoUrl,
  fotoId: remote.foto?.id,
})

const mapRemoteLinkedPet = (remote: RemoteLinkedPet): LinkedPet => ({
  id: remote.id,
  nome: remote.nome,
  especie: remote.especie,
  raca: remote.raca,
  idade: remote.idade,
  fotoUrl: remote.foto?.url || remote.fotoUrl,
})
