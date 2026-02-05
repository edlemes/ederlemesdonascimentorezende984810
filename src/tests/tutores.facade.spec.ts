import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TutoresFacade } from '../app/features/tutores/facades/tutores.facade'
import type { Tutor } from '../app/features/tutores/models/tutor.model'
import type { TutoresService } from '../app/features/tutores/api/tutores.service'
import type { LinkedPet } from '../app/features/tutores/facades/tutores.facade'

describe('TutoresFacade', () => {
  let facade: TutoresFacade
  let mockTutoresService: TutoresService

  beforeEach(() => {
    mockTutoresService = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      uploadPhoto: vi.fn(),
      linkPet: vi.fn(),
      unlinkPet: vi.fn(),
      deletePhoto: vi.fn(),
    } as any

    facade = new TutoresFacade(mockTutoresService)
    vi.clearAllMocks()
  })

  it('loads tutores and updates observable state', async () => {
    const emitted: Tutor[][] = []
    const sub = facade.tutores$.subscribe((value) => emitted.push(value))

    vi.mocked(mockTutoresService.getAll).mockResolvedValue({
      content: [
        {
          id: 1,
          nome: 'João Silva',
          email: 'joao@example.com',
          cpf: 12345678901,
          telefone: '(65) 99999-9999',
          endereco: 'Rua Principal, 123',
          foto: { url: 'https://example.com/joao.png' },
        },
      ],
      pageCount: 1,
      total: 1,
    })

    await facade.getAllTutores(1, '')

    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual([
      {
        id: 1,
        nome: 'João Silva',
        email: 'joao@example.com',
        cpf: 12345678901,
        telefone: '(65) 99999-9999',
        endereco: 'Rua Principal, 123',
        fotoUrl: 'https://example.com/joao.png',
      },
    ])
  })

  it('mapeia fotoUrl a partir de fotoUrl quando não há foto', async () => {
    const emitted: Tutor[][] = []
    const sub = facade.tutores$.subscribe((value) => emitted.push(value))

    vi.mocked(mockTutoresService.getAll).mockResolvedValue({
      content: [
        {
          id: 1,
          nome: 'João Silva',
          telefone: 'x',
          endereco: 'y',
          fotoUrl: 'https://example.com/fallback.png',
        },
      ],
      pageCount: 1,
      total: 1,
    } as any)

    await facade.getAllTutores(0, '')
    sub.unsubscribe()

    expect(emitted.at(-1)?.[0]?.fotoUrl).toBe('https://example.com/fallback.png')
  })

  it('loads tutor by id and updates selectedTutor$', async () => {
    const emitted: (Tutor | null)[] = []
    const sub = facade.selectedTutor$.subscribe((value) => emitted.push(value))

    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 2,
      nome: 'Maria Santos',
      email: 'maria@example.com',
      cpf: 10987654321,
      telefone: '(65) 98888-8888',
      endereco: 'Av. Central, 456',
      foto: { url: 'https://example.com/maria.png' },
      pets: [],
    })

    await facade.getTutorById(2)

    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual({
      id: 2,
      nome: 'Maria Santos',
      email: 'maria@example.com',
      cpf: 10987654321,
      telefone: '(65) 98888-8888',
      endereco: 'Av. Central, 456',
      fotoUrl: 'https://example.com/maria.png',
    })
  })

  it('quando getById retorna null, limpa selectedTutor e linkedPets', async () => {
    const selected: Array<Tutor | null> = []
    const linked: Array<LinkedPet[]> = []
    const subS = facade.selectedTutor$.subscribe((v) => selected.push(v))
    const subL = facade.linkedPets$.subscribe((v) => linked.push(v))

    vi.mocked(mockTutoresService.getById).mockResolvedValue(null as any)
    await facade.getTutorById(999)

    subS.unsubscribe()
    subL.unsubscribe()

    expect(selected.at(-1)).toBeNull()
    expect(linked.at(-1)).toEqual([])
  })

  it('sets isLoading during requests', async () => {
    const loadingStates: boolean[] = []
    const sub = facade.isLoading$.subscribe((value) => loadingStates.push(value))

    vi.mocked(mockTutoresService.getAll).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ content: [] }), 10))
    )

    const promise = facade.getAllTutores(1, '')

    expect(loadingStates).toContain(true)

    await promise
    sub.unsubscribe()

    expect(loadingStates.at(-1)).toBe(false)
  })

  it('creates tutor and returns id', async () => {
    vi.mocked(mockTutoresService.create).mockResolvedValue({
      id: 10,
      nome: 'Pedro Costa',
      email: 'pedro@example.com',
      cpf: 20202020202,
      telefone: '(65) 97777-7777',
      endereco: 'Rua Nova, 789',
    })

    const result = await facade.saveTutor({
      nome: 'Pedro Costa',
      email: 'pedro@example.com',
      cpf: 20202020202,
      telefone: '(65) 97777-7777',
      endereco: 'Rua Nova, 789',
    })

    expect(result).toBe(10)
    expect(mockTutoresService.create).toHaveBeenCalledWith({
      nome: 'Pedro Costa',
      email: 'pedro@example.com',
      cpf: 20202020202,
      telefone: '(65) 97777-7777',
      endereco: 'Rua Nova, 789',
    })
  })

  it('updates existing tutor', async () => {
    vi.mocked(mockTutoresService.update).mockResolvedValue({
      id: 5,
      nome: 'Ana Lima',
      email: 'ana.lima@example.com',
      cpf: 30303030303,
      telefone: '(65) 96666-6666',
      endereco: 'Praça da Paz, 321',
    })

    const result = await facade.saveTutor({
      id: 5,
      nome: 'Ana Lima',
      email: 'ana.lima@example.com',
      cpf: 30303030303,
      telefone: '(65) 96666-6666',
      endereco: 'Praça da Paz, 321',
    })

    expect(result).toBe(5)
    expect(mockTutoresService.update).toHaveBeenCalledWith(5, {
      id: 5,
      nome: 'Ana Lima',
      email: 'ana.lima@example.com',
      cpf: 30303030303,
      telefone: '(65) 96666-6666',
      endereco: 'Praça da Paz, 321',
    })
  })

  it('links pet to tutor', async () => {
    vi.mocked(mockTutoresService.linkPet).mockResolvedValue(undefined)

    await facade.linkPet(3, 7)

    expect(mockTutoresService.linkPet).toHaveBeenCalledWith(3, 7)
  })

  it('unlinks pet from tutor', async () => {
    vi.mocked(mockTutoresService.unlinkPet).mockResolvedValue(undefined)

    await facade.unlinkPet(3, 7)

    expect(mockTutoresService.unlinkPet).toHaveBeenCalledWith(3, 7)
  })

  it('remove pet do estado ao unlinkPet', async () => {
    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 3,
      nome: 'T',
      email: 't@example.com',
      cpf: 40404040404,
      telefone: 'x',
      endereco: 'y',
      pets: [
        { id: 7, nome: 'P1', especie: 'Cachorro', raca: 'SRD', idade: 2 },
        { id: 8, nome: 'P2', especie: 'Gato', raca: 'SRD', idade: 1 },
      ],
    } as any)

    await facade.getTutorById(3)

    const linked: Array<LinkedPet[]> = []
    const sub = facade.linkedPets$.subscribe((v) => linked.push(v))

    vi.mocked(mockTutoresService.unlinkPet).mockResolvedValue(undefined)
    await facade.unlinkPet(3, 7)

    sub.unsubscribe()

    expect(linked.at(-1)).toEqual([
      { id: 8, nome: 'P2', especie: 'Gato', raca: 'SRD', idade: 1, fotoUrl: undefined },
    ])
  })

  it('should upload photo and refresh tutor data', async () => {
    const mockFile = new File(['photo'], 'tutor.jpg', { type: 'image/jpeg' })
    vi.mocked(mockTutoresService.uploadPhoto).mockResolvedValue({ url: 'http://example.com/tutor.jpg' })
    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 1,
      nome: 'João Silva',
      email: 'joao@example.com',
      cpf: 12345678901,
      telefone: '(65) 99999-9999',
      endereco: 'Rua Principal, 123',
      foto: { url: 'http://example.com/tutor.jpg', id: 1 },
    })

    await facade.uploadPhoto(1, mockFile)

    expect(mockTutoresService.uploadPhoto).toHaveBeenCalledWith(1, mockFile)
    expect(mockTutoresService.getById).toHaveBeenCalledWith(1)
  })

  it('should handle upload photo error', async () => {
    const mockFile = new File(['photo'], 'tutor.jpg', { type: 'image/jpeg' })
    const error = new Error('Upload failed')
    vi.mocked(mockTutoresService.uploadPhoto).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.uploadPhoto(1, mockFile)).rejects.toThrow('Upload failed')

    sub.unsubscribe()
    expect(errors).toContain('Upload failed')
  })

  it('should delete photo and refresh tutor data', async () => {
    vi.mocked(mockTutoresService.deletePhoto).mockResolvedValue(undefined)
    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 1,
      nome: 'João Silva',
      email: 'joao@example.com',
      cpf: 12345678901,
      telefone: '(65) 99999-9999',
      endereco: 'Rua Principal, 123',
    })

    await facade.deletePhoto(1, 5)

    expect(mockTutoresService.deletePhoto).toHaveBeenCalledWith(1, 5)
    expect(mockTutoresService.getById).toHaveBeenCalledWith(1)
  })

  it('should handle linkPet error', async () => {
    const error = new Error('Link failed')
    vi.mocked(mockTutoresService.linkPet).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.linkPet(1, 5)).rejects.toThrow('Link failed')

    sub.unsubscribe()
    expect(errors).toContain('Link failed')
  })

  it('should handle unlinkPet error', async () => {
    const error = new Error('Unlink failed')
    vi.mocked(mockTutoresService.unlinkPet).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.unlinkPet(1, 5)).rejects.toThrow('Unlink failed')

    sub.unsubscribe()
    expect(errors).toContain('Unlink failed')
  })

  it('should clear selected tutor and linked pets', () => {
    const selectedEmitted: Array<Tutor | null> = []
    const petsEmitted: LinkedPet[][] = []
    const subSelected = facade.selectedTutor$.subscribe((value) => selectedEmitted.push(value))
    const subPets = facade.linkedPets$.subscribe((value) => petsEmitted.push(value))

    facade.clearSelectedTutor()

    subSelected.unsubscribe()
    subPets.unsubscribe()
    expect(selectedEmitted.at(-1)).toBeNull()
    expect(petsEmitted.at(-1)).toEqual([])
  })

  it('should clear error', () => {
    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    facade.clearError()

    sub.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it('should handle delete tutor error', async () => {
    const error = new Error('Delete failed')
    vi.mocked(mockTutoresService.remove).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.deleteTutor(1)).rejects.toThrow('Delete failed')

    sub.unsubscribe()
    expect(errors).toContain('Delete failed')
  })

  it('remove tutor do estado ao deleteTutor', async () => {
    vi.mocked(mockTutoresService.getAll).mockResolvedValue({
      content: [
        { id: 1, nome: 'A', email: 'a@example.com', cpf: 11111111111, telefone: 'x', endereco: 'y' },
        { id: 2, nome: 'B', email: 'b@example.com', cpf: 22222222222, telefone: 'x', endereco: 'y' },
      ],
      pageCount: 1,
      total: 2,
    } as any)

    await facade.getAllTutores(0, '')

    const emitted: Tutor[][] = []
    const sub = facade.tutores$.subscribe((v) => emitted.push(v))

    vi.mocked(mockTutoresService.remove).mockResolvedValue(undefined)
    await facade.deleteTutor(1)

    sub.unsubscribe()
    expect(emitted.at(-1)?.map((t) => t.id)).toEqual([2])
  })
})
