import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PetsFacade } from '../app/features/pets/facades/pets.facade'
import type { Pet } from '../app/features/pets/models/pet.model'
import type { PetsService } from '../app/features/pets/api/pets.service'

describe('PetsFacade', () => {
  let facade: PetsFacade
  let mockService: PetsService

  beforeEach(() => {
    mockService = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      uploadPhoto: vi.fn(),
      deletePhoto: vi.fn(),
    } as any

    facade = new PetsFacade(mockService)
    vi.clearAllMocks()
  })

  it('loads pets and updates observable state', async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        {
          id: 1,
          nome: 'Rex',
          especie: 'Cachorro',
          raca: 'Labrador',
          idade: 4,
          foto: { url: 'https://example.com/rex.png' },
        },
      ],
      pageCount: 2,
      total: 12,
    })

    await facade.getAllPets(1, '')

    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual([
      {
        id: 1,
        nome: 'Rex',
        especie: 'Cachorro',
        raca: 'Labrador',
        idade: 4,
        fotoUrl: 'https://example.com/rex.png',
      },
    ])
    expect(mockService.getAll).toHaveBeenCalledWith(1, '', 10)
  })

  it('filtra itens com id inválido ao carregar lista', async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        { id: -1, nome: 'Bad' },
        { id: 'abc', nome: 'Bad2' },
        { id: 2, nome: 'Ok', especie: 'Gato', raca: 'SRD', idade: 1, fotoUrl: 'x' },
      ],
      pageCount: 1,
      total: 1,
    } as any)

    await facade.getAllPets(0, '')
    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual([
      {
        id: 2,
        nome: 'Ok',
        especie: 'Gato',
        raca: 'SRD',
        idade: 1,
        fotoUrl: 'x',
      },
    ])
  })

  it('savePet toggles isSaving$ and calls correct service', async () => {
    const states: boolean[] = []
    const sub = facade.isSaving$.subscribe((value) => states.push(value))
    vi.mocked(mockService.create).mockResolvedValue({
      id: 99,
      nome: 'Bolt',
      especie: 'Cachorro',
      raca: 'SRD',
      idade: 2,
    })

    await facade.savePet({ nome: 'Bolt', especie: 'Cachorro', raca: 'SRD', idade: 2 })

    sub.unsubscribe()

    expect(states).toContain(true)
    expect(states.at(-1)).toBe(false)
    expect(mockService.create).toHaveBeenCalledTimes(1)
  })

  it('ignores invalid ids when fetching pet detail', async () => {
    const selected: Array<Pet | null> = []
    const sub = facade.selectedPet$.subscribe((value) => selected.push(value))

    await facade.getPetById(Number.NaN)

    sub.unsubscribe()

    expect(mockService.getById).not.toHaveBeenCalled()
    expect(selected.at(-1)).toBeNull()
  })

  it('seta selectedPet como null quando service retorna null', async () => {
    const selected: Array<Pet | null> = []
    const sub = facade.selectedPet$.subscribe((value) => selected.push(value))

    vi.mocked(mockService.getById).mockResolvedValue(null as any)
    await facade.getPetById(10)

    sub.unsubscribe()
    expect(selected.at(-1)).toBeNull()
  })

  it('usa tutorId do primeiro item de tutores[] quando tutorId não vem no response', async () => {
    const selected: Array<Pet | null> = []
    const sub = facade.selectedPet$.subscribe((value) => selected.push(value))

    vi.mocked(mockService.getById).mockResolvedValue({
      id: 1,
      nome: 'Rex',
      especie: 'Cachorro',
      raca: 'Lab',
      idade: 5,
      tutores: [{ id: 123 }],
    } as any)

    await facade.getPetById(1)
    sub.unsubscribe()

    expect(selected.at(-1)?.tutorId).toBe(123)
    expect(selected.at(-1)?.tutores).toEqual([{ id: 123 }])
  })

  it('em erro de auth (401), não seta error nem reseta lista', async () => {
    const errors: Array<string | null> = []
    const petsEmitted: Pet[][] = []
    const subE = facade.error$.subscribe((v) => errors.push(v))
    const subP = facade.pets$.subscribe((v) => petsEmitted.push(v))

    vi.mocked(mockService.getAll).mockRejectedValue({ response: { status: 401 } })
    await facade.getAllPets(0, '')

    subE.unsubscribe()
    subP.unsubscribe()

    expect(errors.at(-1)).toBeNull()
    expect(petsEmitted.at(-1)).toEqual([])
  })

  it('should upload photo and refresh pet data', async () => {
    const mockFile = new File(['photo'], 'pet.jpg', { type: 'image/jpeg' })
    vi.mocked(mockService.uploadPhoto).mockResolvedValue({ url: 'http://example.com/pet.jpg' })
    vi.mocked(mockService.getById).mockResolvedValue({
      id: 1,
      nome: 'Rex',
      especie: 'Cachorro',
      raca: 'Labrador',
      idade: 4,
      foto: { url: 'http://example.com/pet.jpg', id: 1 },
    })

    await facade.uploadPhoto(1, mockFile)

    expect(mockService.uploadPhoto).toHaveBeenCalledWith(1, mockFile)
    expect(mockService.getById).toHaveBeenCalledWith(1)
  })

  it('should handle upload photo error', async () => {
    const mockFile = new File(['photo'], 'pet.jpg', { type: 'image/jpeg' })
    const error = new Error('Upload failed')
    vi.mocked(mockService.uploadPhoto).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.uploadPhoto(1, mockFile)).rejects.toThrow('Upload failed')

    sub.unsubscribe()
    expect(errors).toContain('Upload failed')
  })

  it('should delete photo and refresh pet data', async () => {
    vi.mocked(mockService.deletePhoto).mockResolvedValue(undefined)
    vi.mocked(mockService.getById).mockResolvedValue({
      id: 1,
      nome: 'Rex',
      especie: 'Cachorro',
      raca: 'Labrador',
      idade: 4,
    })

    await facade.deletePhoto(1, 5)

    expect(mockService.deletePhoto).toHaveBeenCalledWith(1, 5)
    expect(mockService.getById).toHaveBeenCalledWith(1)
  })

  it('should clear selected pet', () => {
    const selected: Array<Pet | null> = []
    const sub = facade.selectedPet$.subscribe((value) => selected.push(value))

    facade.clearSelectedPet()

    sub.unsubscribe()
    expect(selected.at(-1)).toBeNull()
  })

  it('should clear error', () => {
    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    facade.clearError()

    sub.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it('should handle delete pet error', async () => {
    const error = new Error('Delete failed')
    vi.mocked(mockService.remove).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.deletePet(1)).rejects.toThrow('Delete failed')

    sub.unsubscribe()
    expect(errors).toContain('Delete failed')
  })

  it('should handle update pet error', async () => {
    const error = new Error('Update failed')
    vi.mocked(mockService.update).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.savePet({ id: 1, nome: 'Rex', especie: 'Cachorro', raca: 'Lab', idade: 5 })).rejects.toThrow('Update failed')

    sub.unsubscribe()
    expect(errors).toContain('Update failed')
  })
})
