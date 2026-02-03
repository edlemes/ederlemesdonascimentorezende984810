import { BehaviorSubject, Observable } from 'rxjs'
import { petsService } from '../api/pets.service'
import type { Pet, PaginationState, PetFormData } from '../models/pet.model'
import type { PetsService, RemotePet, RemotePetsResponse } from '../api/pets.service'

export class PetsFacade {
  private _pets = new BehaviorSubject<Pet[]>([])
  private _selectedPet = new BehaviorSubject<Pet | null>(null)
  private _isLoading = new BehaviorSubject<boolean>(false)
  private _isSaving = new BehaviorSubject<boolean>(false)
  private _error = new BehaviorSubject<string | null>(null)
  private _pagination = new BehaviorSubject<PaginationState>({
    page: 0,
    totalPages: 0,
    totalElements: 0,
  })

  public readonly pets$: Observable<Pet[]> = this._pets.asObservable()
  public readonly selectedPet$: Observable<Pet | null> =
    this._selectedPet.asObservable()
  public readonly isLoading$: Observable<boolean> =
    this._isLoading.asObservable()
  public readonly isSaving$: Observable<boolean> =
    this._isSaving.asObservable()
  public readonly error$: Observable<string | null> =
    this._error.asObservable()
  public readonly pagination$: Observable<PaginationState> =
    this._pagination.asObservable()

  private service: PetsService

  constructor(service?: PetsService) {
    this.service = service ?? petsService
  }

  private isAuthError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false
    }

    const record = error as Record<string, unknown>
    const message = typeof record.message === 'string' ? record.message : undefined
    const isAuthError = record.isAuthError === true

    const response = record.response
    const status =
      response && typeof response === 'object'
        ? (response as Record<string, unknown>).status
        : undefined

    return status === 401 || message === 'Authentication required' || isAuthError
  }

  async getAllPets(page: number, nome = "", size = 10): Promise<void> {
    this._isLoading.next(true)
    this._error.next(null)

    try {
      const response: RemotePetsResponse = await this.service.getAll(page, nome, size)

      const content = response.content || []

      const pets: Pet[] = content.flatMap((item: RemotePet) => {
        const id = Number(item.id)
        if (!Number.isFinite(id) || id <= 0) {
          return []
        }

        return [
          {
            id,
            nome: item.nome,
            raca: item.raca,
            especie: item.especie,
            idade: item.idade,
            fotoUrl: item.foto?.url || item.fotoUrl,
            fotoId: item.foto?.id,
            tutorId: item.tutorId,
          },
        ]
      })

      this._pets.next(pets)
      this._pagination.next({
        page,
        totalPages: response.pageCount || 0,
        totalElements: response.total || 0,
      })
    } catch (error: unknown) {
      if (this.isAuthError(error)) return

      this._error.next("Erro ao buscar lista de pets.")
      this._pets.next([])
      this._pagination.next({ page: 0, totalPages: 0, totalElements: 0 })
    } finally {
      this._isLoading.next(false)
    }
  }

  async getPetById(id: number): Promise<void> {
    if (!Number.isFinite(id) || id <= 0) {
      this._selectedPet.next(null)
      return
    }

    this._isLoading.next(true)
    this._error.next(null)

    try {
      const response: RemotePet | null = await this.service.getById(id)
      if (response) {
        const tutorId = response.tutorId ?? response.tutores?.[0]?.id

        const pet: Pet = {
          id: response.id,
          nome: response.nome,
          especie: response.especie,
          idade: response.idade,
          raca: response.raca,
          fotoUrl: response.foto?.url || response.fotoUrl,
          fotoId: response.foto?.id,
          tutorId: tutorId,
          tutores: response.tutores,
        }
        this._selectedPet.next(pet)
      } else {
        this._selectedPet.next(null)
      }
    } catch (error: unknown) {
      if (this.isAuthError(error)) return

      const errorMessage =
        error instanceof Error ? error.message : "Failed to load pet"
      this._error.next(errorMessage)
      this._selectedPet.next(null)
    } finally {
      this._isLoading.next(false)
    }
  }

  async savePet(data: PetFormData): Promise<Pet> {
    this._isSaving.next(true)
    this._error.next(null)

    try {
      let result: Pet
      if (data.id) {
        result = await this.service.update(data.id, data)
      } else {
        result = await this.service.create(data)
      }
      return result
    } catch (error: unknown) {
      if (this.isAuthError(error)) throw error

      const errorMessage =
        error instanceof Error ? error.message : "Failed to save pet"
      this._error.next(errorMessage)
      throw error
    } finally {
      this._isSaving.next(false)
    }
  }

  async deletePet(id: number): Promise<void> {
    this._isLoading.next(true)
    this._error.next(null)

    try {
      await this.service.remove(id)
      const currentPets = this._pets.value.filter((pet) => pet.id !== id)
      this._pets.next(currentPets)
    } catch (error: unknown) {
      if (this.isAuthError(error)) return

      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete pet"
      this._error.next(errorMessage)
      throw error
    } finally {
      this._isLoading.next(false)
    }
  }

  async uploadPhoto(id: number, file: File): Promise<void> {
    this._isSaving.next(true)
    this._error.next(null)

    try {
      await this.service.uploadPhoto(id, file)
      await this.getPetById(id)
    } catch (error: unknown) {
      if (this.isAuthError(error)) return

      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload photo"
      this._error.next(errorMessage)
      throw error
    } finally {
      this._isSaving.next(false)
    }
  }

  async deletePhoto(id: number, photoId: number): Promise<void> {
    this._isSaving.next(true)
    this._error.next(null)

    try {
      await this.service.deletePhoto(id, photoId)
      await this.getPetById(id)
    } catch (error: unknown) {
      if (this.isAuthError(error)) return

      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete photo"
      this._error.next(errorMessage)
      throw error
    } finally {
      this._isSaving.next(false)
    }
  }

  clearSelectedPet(): void {
    this._selectedPet.next(null)
    this._error.next(null)
  }

  clearError(): void {
    this._error.next(null)
  }
}

export const petsFacade = new PetsFacade()
