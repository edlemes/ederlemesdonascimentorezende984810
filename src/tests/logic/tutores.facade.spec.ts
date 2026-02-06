import { describe, it, expect, vi, beforeEach } from "vitest"
import { TutoresFacade } from "../../app/features/tutores/facades/tutores.facade"
import type { Tutor } from "../../app/features/tutores/models/tutor.model"
import type { TutoresService } from "../../app/features/tutores/api/tutores.service"
import type { LinkedPet } from "../../app/features/tutores/facades/tutores.facade"

describe("TutoresFacade", () => {
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

  it("carrega tutores e atualiza estado do observable", async () => {
    const emitted: Tutor[][] = []
    const sub = facade.tutores$.subscribe((value) => emitted.push(value))

    vi.mocked(mockTutoresService.getAll).mockResolvedValue({
      content: [
        {
          id: 1,
          nome: "João Silva",
          email: "joao@example.com",
          cpf: 12345678901,
          telefone: "(65) 99999-9999",
          endereco: "Rua Principal, 123",
          foto: { url: "https://example.com/joao.png" },
        },
      ],
      pageCount: 1,
      total: 1,
    })

    await facade.getAllTutores(1, "")

    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual([
      {
        id: 1,
        nome: "João Silva",
        email: "joao@example.com",
        cpf: 12345678901,
        telefone: "(65) 99999-9999",
        endereco: "Rua Principal, 123",
        fotoUrl: "https://example.com/joao.png",
      },
    ])
  })

  it("mapeia fotoUrl a partir de fotoUrl quando não há foto", async () => {
    const emitted: Tutor[][] = []
    const sub = facade.tutores$.subscribe((value) => emitted.push(value))

    vi.mocked(mockTutoresService.getAll).mockResolvedValue({
      content: [
        {
          id: 1,
          nome: "João Silva",
          telefone: "x",
          endereco: "y",
          fotoUrl: "https://example.com/fallback.png",
        },
      ],
      pageCount: 1,
      total: 1,
    } as any)

    await facade.getAllTutores(0, "")
    sub.unsubscribe()

    expect(emitted.at(-1)?.[0]?.fotoUrl).toBe(
      "https://example.com/fallback.png",
    )
  })

  it("carrega tutor por id e atualiza selectedTutor$", async () => {
    const emitted: (Tutor | null)[] = []
    const sub = facade.selectedTutor$.subscribe((value) => emitted.push(value))

    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 2,
      nome: "Maria Santos",
      email: "maria@example.com",
      cpf: 10987654321,
      telefone: "(65) 98888-8888",
      endereco: "Av. Central, 456",
      foto: { url: "https://example.com/maria.png" },
      pets: [],
    })

    await facade.getTutorById(2)

    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual({
      id: 2,
      nome: "Maria Santos",
      email: "maria@example.com",
      cpf: 10987654321,
      telefone: "(65) 98888-8888",
      endereco: "Av. Central, 456",
      fotoUrl: "https://example.com/maria.png",
    })
  })

  it("quando getById retorna null, limpa selectedTutor e linkedPets", async () => {
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

  it("seta isLoading durante requisições", async () => {
    const loadingStates: boolean[] = []
    const sub = facade.isLoading$.subscribe((value) =>
      loadingStates.push(value),
    )

    vi.mocked(mockTutoresService.getAll).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ content: [] }), 10),
        ),
    )

    const promise = facade.getAllTutores(1, "")

    expect(loadingStates).toContain(true)

    await promise
    sub.unsubscribe()

    expect(loadingStates.at(-1)).toBe(false)
  })

  it("cria tutor e retorna id", async () => {
    vi.mocked(mockTutoresService.create).mockResolvedValue({
      id: 10,
      nome: "Pedro Costa",
      email: "pedro@example.com",
      cpf: 20202020202,
      telefone: "(65) 97777-7777",
      endereco: "Rua Nova, 789",
    })

    const result = await facade.saveTutor({
      nome: "Pedro Costa",
      email: "pedro@example.com",
      cpf: 20202020202,
      telefone: "(65) 97777-7777",
      endereco: "Rua Nova, 789",
    })

    expect(result).toBe(10)
    expect(mockTutoresService.create).toHaveBeenCalledWith({
      nome: "Pedro Costa",
      email: "pedro@example.com",
      cpf: 20202020202,
      telefone: "(65) 97777-7777",
      endereco: "Rua Nova, 789",
    })
  })

  it("saveTutor seta isSaving durante create", async () => {
    const savingStates: boolean[] = []
    const sub = facade.isSaving$.subscribe((v) => savingStates.push(v))

    vi.mocked(mockTutoresService.create).mockResolvedValue({
      id: 1,
      nome: "X",
      telefone: "Y",
      endereco: "Z",
    } as any)

    await facade.saveTutor({ nome: "X", telefone: "Y", endereco: "Z" })

    sub.unsubscribe()

    expect(savingStates).toContain(true)
    expect(savingStates.at(-1)).toBe(false)
  })

  it("saveTutor seta isSaving durante update", async () => {
    const savingStates: boolean[] = []
    const sub = facade.isSaving$.subscribe((v) => savingStates.push(v))

    vi.mocked(mockTutoresService.update).mockResolvedValue({
      id: 5,
      nome: "X",
      telefone: "Y",
      endereco: "Z",
    } as any)

    await facade.saveTutor({ id: 5, nome: "X", telefone: "Y", endereco: "Z" })

    sub.unsubscribe()

    expect(savingStates).toContain(true)
    expect(savingStates.at(-1)).toBe(false)
  })

  it("atualiza tutor existente", async () => {
    vi.mocked(mockTutoresService.update).mockResolvedValue({
      id: 5,
      nome: "Ana Lima",
      email: "ana.lima@example.com",
      cpf: 30303030303,
      telefone: "(65) 96666-6666",
      endereco: "Praça da Paz, 321",
    })

    const result = await facade.saveTutor({
      id: 5,
      nome: "Ana Lima",
      email: "ana.lima@example.com",
      cpf: 30303030303,
      telefone: "(65) 96666-6666",
      endereco: "Praça da Paz, 321",
    })

    expect(result).toBe(5)
    expect(mockTutoresService.update).toHaveBeenCalledWith(5, {
      id: 5,
      nome: "Ana Lima",
      email: "ana.lima@example.com",
      cpf: 30303030303,
      telefone: "(65) 96666-6666",
      endereco: "Praça da Paz, 321",
    })
  })

  it("vincula pet ao tutor", async () => {
    vi.mocked(mockTutoresService.linkPet).mockResolvedValue(undefined)

    await facade.linkPet(3, 7)

    expect(mockTutoresService.linkPet).toHaveBeenCalledWith(3, 7)
  })

  it("desvincula pet do tutor", async () => {
    vi.mocked(mockTutoresService.unlinkPet).mockResolvedValue(undefined)

    await facade.unlinkPet(3, 7)

    expect(mockTutoresService.unlinkPet).toHaveBeenCalledWith(3, 7)
  })

  it("remove pet do estado ao unlinkPet", async () => {
    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 3,
      nome: "T",
      email: "t@example.com",
      cpf: 40404040404,
      telefone: "x",
      endereco: "y",
      pets: [
        { id: 7, nome: "P1", especie: "Cachorro", raca: "SRD", idade: 2 },
        { id: 8, nome: "P2", especie: "Gato", raca: "SRD", idade: 1 },
      ],
    } as any)

    await facade.getTutorById(3)

    const linked: Array<LinkedPet[]> = []
    const sub = facade.linkedPets$.subscribe((v) => linked.push(v))

    vi.mocked(mockTutoresService.unlinkPet).mockResolvedValue(undefined)
    await facade.unlinkPet(3, 7)

    sub.unsubscribe()

    expect(linked.at(-1)).toEqual([
      {
        id: 8,
        nome: "P2",
        especie: "Gato",
        raca: "SRD",
        idade: 1,
        fotoUrl: undefined,
      },
    ])
  })

  it("deve fazer upload de foto e atualizar dados do tutor", async () => {
    const mockFile = new File(["photo"], "tutor.jpg", { type: "image/jpeg" })
    vi.mocked(mockTutoresService.uploadPhoto).mockResolvedValue({
      url: "http://example.com/tutor.jpg",
    })
    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 1,
      nome: "João Silva",
      email: "joao@example.com",
      cpf: 12345678901,
      telefone: "(65) 99999-9999",
      endereco: "Rua Principal, 123",
      foto: { url: "http://example.com/tutor.jpg", id: 1 },
    })

    await facade.uploadPhoto(1, mockFile)

    expect(mockTutoresService.uploadPhoto).toHaveBeenCalledWith(1, mockFile)
    expect(mockTutoresService.getById).toHaveBeenCalledWith(1)
  })

  it("deve tratar erro de upload de foto", async () => {
    const mockFile = new File(["photo"], "tutor.jpg", { type: "image/jpeg" })
    const error = new Error("Falha no upload")
    vi.mocked(mockTutoresService.uploadPhoto).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.uploadPhoto(1, mockFile)).rejects.toThrow(
      "Falha no upload",
    )

    sub.unsubscribe()
    expect(errors).toContain("Falha no upload")
  })

  it("deve excluir foto e atualizar dados do tutor", async () => {
    vi.mocked(mockTutoresService.deletePhoto).mockResolvedValue(undefined)
    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 1,
      nome: "João Silva",
      email: "joao@example.com",
      cpf: 12345678901,
      telefone: "(65) 99999-9999",
      endereco: "Rua Principal, 123",
    })

    await facade.deletePhoto(1, 5)

    expect(mockTutoresService.deletePhoto).toHaveBeenCalledWith(1, 5)
    expect(mockTutoresService.getById).toHaveBeenCalledWith(1)
  })

  it("deve tratar erro de linkPet", async () => {
    const error = new Error("Falha na vinculação")
    vi.mocked(mockTutoresService.linkPet).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.linkPet(1, 5)).rejects.toThrow("Falha na vinculação")

    sub.unsubscribe()
    expect(errors).toContain("Falha na vinculação")
  })

  it("deve tratar erro de unlinkPet", async () => {
    const error = new Error("Falha na desvinculação")
    vi.mocked(mockTutoresService.unlinkPet).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.unlinkPet(1, 5)).rejects.toThrow(
      "Falha na desvinculação",
    )

    sub.unsubscribe()
    expect(errors).toContain("Falha na desvinculação")
  })

  it("deve limpar tutor selecionado e pets vinculados", () => {
    const selectedEmitted: Array<Tutor | null> = []
    const petsEmitted: LinkedPet[][] = []
    const subSelected = facade.selectedTutor$.subscribe((value) =>
      selectedEmitted.push(value),
    )
    const subPets = facade.linkedPets$.subscribe((value) =>
      petsEmitted.push(value),
    )

    facade.clearSelectedTutor()

    subSelected.unsubscribe()
    subPets.unsubscribe()
    expect(selectedEmitted.at(-1)).toBeNull()
    expect(petsEmitted.at(-1)).toEqual([])
  })

  it("deve limpar erro", () => {
    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    facade.clearError()

    sub.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it("deve tratar erro de deletePhoto", async () => {
    const error = new Error("Falha ao deletar foto")
    vi.mocked(mockTutoresService.deletePhoto).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.deletePhoto(1, 5)).rejects.toThrow(
      "Falha ao deletar foto",
    )

    sub.unsubscribe()
    expect(errors).toContain("Falha ao deletar foto")
  })

  it("deve tratar erro de saveTutor ao criar", async () => {
    const error = new Error("Falha ao criar")
    vi.mocked(mockTutoresService.create).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(
      facade.saveTutor({
        nome: "Test",
        telefone: "123",
        endereco: "Rua",
      }),
    ).rejects.toThrow("Falha ao criar")

    sub.unsubscribe()
    expect(errors).toContain("Falha ao criar")
  })

  it("deve tratar erro de exclusão de tutor", async () => {
    const error = new Error("Falha ao deletar")
    vi.mocked(mockTutoresService.remove).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.deleteTutor(1)).rejects.toThrow("Falha ao deletar")

    sub.unsubscribe()
    expect(errors).toContain("Falha ao deletar")
  })

  it("remove tutor do estado ao deleteTutor", async () => {
    vi.mocked(mockTutoresService.getAll).mockResolvedValue({
      content: [
        {
          id: 1,
          nome: "A",
          email: "a@example.com",
          cpf: 11111111111,
          telefone: "x",
          endereco: "y",
        },
        {
          id: 2,
          nome: "B",
          email: "b@example.com",
          cpf: 22222222222,
          telefone: "x",
          endereco: "y",
        },
      ],
      pageCount: 1,
      total: 2,
    } as any)

    await facade.getAllTutores(0, "")

    const emitted: Tutor[][] = []
    const sub = facade.tutores$.subscribe((v) => emitted.push(v))

    vi.mocked(mockTutoresService.remove).mockResolvedValue(undefined)
    await facade.deleteTutor(1)

    sub.unsubscribe()
    expect(emitted.at(-1)?.map((t) => t.id)).toEqual([2])
  })

  it("deve tratar erro de getAllTutores", async () => {
    const error = new Error("Falha ao carregar tutores")
    vi.mocked(mockTutoresService.getAll).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const tutoresEmitted: Tutor[][] = []
    const subE = facade.error$.subscribe((v) => errors.push(v))
    const subT = facade.tutores$.subscribe((v) => tutoresEmitted.push(v))

    await facade.getAllTutores(1, "")

    subE.unsubscribe()
    subT.unsubscribe()

    expect(errors).toContain("Falha ao carregar tutores")
    expect(tutoresEmitted.at(-1)).toEqual([])
  })

  it("deve tratar erro de getTutorById", async () => {
    const error = new Error("Falha ao carregar tutor")
    vi.mocked(mockTutoresService.getById).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const selectedEmitted: Array<Tutor | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))
    const subS = facade.selectedTutor$.subscribe((v) =>
      selectedEmitted.push(v),
    )

    await facade.getTutorById(1)

    subE.unsubscribe()
    subS.unsubscribe()

    expect(errors).toContain("Falha ao carregar tutor")
    expect(selectedEmitted.at(-1)).toBeNull()
  })

  it("quando error não é Error instance em getAllTutores, usa mensagem padrão", async () => {
    vi.mocked(mockTutoresService.getAll).mockRejectedValue({ custom: "obj" })

    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    await facade.getAllTutores(0, "")

    subE.unsubscribe()
    expect(errors).toContain("Falha ao carregar tutores")
  })

  it("quando error não é Error instance em getTutorById, usa mensagem padrão", async () => {
    vi.mocked(mockTutoresService.getById).mockRejectedValue({ custom: "obj" })

    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    await facade.getTutorById(1)

    subE.unsubscribe()
    expect(errors).toContain("Falha ao carregar tutor")
  })

  it("quando error não é Error instance em saveTutor, usa mensagem padrão", async () => {
    vi.mocked(mockTutoresService.create).mockRejectedValue({ custom: "obj" })

    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    await expect(
      facade.saveTutor({ nome: "X", telefone: "Y", endereco: "Z" }),
    ).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Falha ao salvar tutor")
  })

  it("quando error não é Error instance em deleteTutor, usa mensagem padrão", async () => {
    vi.mocked(mockTutoresService.remove).mockRejectedValue({ custom: "obj" })

    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    await expect(facade.deleteTutor(1)).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Falha ao deletar tutor")
  })

  it("quando error não é Error instance em uploadPhoto, usa mensagem padrão", async () => {
    const mockFile = new File(["photo"], "tutor.jpg", { type: "image/jpeg" })
    vi.mocked(mockTutoresService.uploadPhoto).mockRejectedValue({
      custom: "obj",
    })

    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    await expect(facade.uploadPhoto(1, mockFile)).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Falha no upload da foto")
  })

  it("quando error não é Error instance em linkPet, usa mensagem padrão", async () => {
    vi.mocked(mockTutoresService.linkPet).mockRejectedValue({ custom: "obj" })

    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    await expect(facade.linkPet(1, 5)).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Falha ao vincular pet")
  })

  it("quando error não é Error instance em unlinkPet, usa mensagem padrão", async () => {
    vi.mocked(mockTutoresService.unlinkPet).mockRejectedValue({
      custom: "obj",
    })

    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    await expect(facade.unlinkPet(1, 5)).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Falha ao desvincular pet")
  })

  it("quando error não é Error instance em deletePhoto, usa mensagem padrão", async () => {
    vi.mocked(mockTutoresService.deletePhoto).mockRejectedValue({
      custom: "obj",
    })

    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    await expect(facade.deletePhoto(1, 5)).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Falha ao deletar foto")
  })

  it("mapeia linkedPets com fotoUrl quando não há foto", async () => {
    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 1,
      nome: "T",
      email: "t@example.com",
      cpf: 11111111111,
      telefone: "x",
      endereco: "y",
      pets: [
        {
          id: 7,
          nome: "P1",
          especie: "Cachorro",
          raca: "SRD",
          idade: 2,
          fotoUrl: "https://example.com/pet.png",
        },
      ],
    } as any)

    const linked: Array<LinkedPet[]> = []
    const sub = facade.linkedPets$.subscribe((v) => linked.push(v))

    await facade.getTutorById(1)

    sub.unsubscribe()

    expect(linked.at(-1)?.[0]?.fotoUrl).toBe("https://example.com/pet.png")
  })

  it("mapeia linkedPets com foto.url quando foto existe", async () => {
    vi.mocked(mockTutoresService.getById).mockResolvedValue({
      id: 1,
      nome: "T",
      email: "t@example.com",
      cpf: 11111111111,
      telefone: "x",
      endereco: "y",
      pets: [
        {
          id: 7,
          nome: "P1",
          especie: "Cachorro",
          raca: "SRD",
          idade: 2,
          foto: { id: 1, url: "https://example.com/pet-foto.png" },
        },
      ],
    } as any)

    const linked: Array<LinkedPet[]> = []
    const sub = facade.linkedPets$.subscribe((v) => linked.push(v))

    await facade.getTutorById(1)

    sub.unsubscribe()

    expect(linked.at(-1)?.[0]?.fotoUrl).toBe(
      "https://example.com/pet-foto.png",
    )
  })

  it("trata response.content undefined em getAllTutores", async () => {
    vi.mocked(mockTutoresService.getAll).mockResolvedValue({
      pageCount: 0,
      total: 0,
    } as any)

    const emitted: Tutor[][] = []
    const sub = facade.tutores$.subscribe((v) => emitted.push(v))

    await facade.getAllTutores(0, "")

    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual([])
  })
})
