import { describe, it, expect, vi, beforeEach } from "vitest"
import { PetsFacade } from "../../app/features/pets/facades/pets.facade"
import type { Pet } from "../../app/features/pets/models/pet.model"
import type { PetsService } from "../../app/features/pets/api/pets.service"
import { tutoresService } from "../../app/features/tutores/api/tutores.service"

vi.mock("../../app/features/tutores/api/tutores.service", () => ({
  tutoresService: {
    getAll: vi.fn().mockResolvedValue({ content: [], pageCount: 0, total: 0 }),
    getById: vi.fn().mockResolvedValue(null),
  },
}))

describe("PetsFacade", () => {
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

  it("carrega pets e atualiza estado do observable", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        {
          id: 1,
          nome: "Rex",
          especie: "Cachorro",
          raca: "Labrador",
          idade: 4,
          foto: { url: "https://example.com/rex.png" },
        },
      ],
      pageCount: 2,
      total: 12,
    })

    await facade.getAllPets(1, "")

    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual([
      {
        id: 1,
        nome: "Rex",
        especie: "Cachorro",
        raca: "Labrador",
        idade: 4,
        fotoUrl: "https://example.com/rex.png",
      },
    ])
    expect(mockService.getAll).toHaveBeenCalledWith(1, "", 10)
  })

  it("filtra itens com id inválido ao carregar lista", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        { id: -1, nome: "Bad" },
        { id: "abc", nome: "Bad2" },
        {
          id: 2,
          nome: "Ok",
          especie: "Gato",
          raca: "SRD",
          idade: 1,
          fotoUrl: "x",
        },
      ],
      pageCount: 1,
      total: 1,
    } as any)

    await facade.getAllPets(0, "")
    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual([
      {
        id: 2,
        nome: "Ok",
        especie: "Gato",
        raca: "SRD",
        idade: 1,
        fotoUrl: "x",
      },
    ])
  })

  it("savePet alterna isSaving$ e chama service correto", async () => {
    const states: boolean[] = []
    const sub = facade.isSaving$.subscribe((value) => states.push(value))
    vi.mocked(mockService.create).mockResolvedValue({
      id: 99,
      nome: "Bolt",
      especie: "Cachorro",
      raca: "SRD",
      idade: 2,
    })

    await facade.savePet({
      nome: "Bolt",
      especie: "Cachorro",
      raca: "SRD",
      idade: 2,
    })

    sub.unsubscribe()

    expect(states).toContain(true)
    expect(states.at(-1)).toBe(false)
    expect(mockService.create).toHaveBeenCalledTimes(1)
  })

  it("ignora ids inválidos ao buscar detalhe do pet", async () => {
    const selected: Array<Pet | null> = []
    const sub = facade.selectedPet$.subscribe((value) => selected.push(value))

    await facade.getPetById(Number.NaN)

    sub.unsubscribe()

    expect(mockService.getById).not.toHaveBeenCalled()
    expect(selected.at(-1)).toBeNull()
  })

  it("seta selectedPet como null quando service retorna null", async () => {
    const selected: Array<Pet | null> = []
    const sub = facade.selectedPet$.subscribe((value) => selected.push(value))

    vi.mocked(mockService.getById).mockResolvedValue(null as any)
    await facade.getPetById(10)

    sub.unsubscribe()
    expect(selected.at(-1)).toBeNull()
  })

  it("usa tutorId do primeiro item de tutores[] quando tutorId não vem no response", async () => {
    const selected: Array<Pet | null> = []
    const sub = facade.selectedPet$.subscribe((value) => selected.push(value))

    vi.mocked(mockService.getById).mockResolvedValue({
      id: 1,
      nome: "Rex",
      especie: "Cachorro",
      raca: "Lab",
      idade: 5,
      tutores: [{ id: 123 }],
    } as any)

    await facade.getPetById(1)
    sub.unsubscribe()

    expect(selected.at(-1)?.tutorId).toBe(123)
    expect(selected.at(-1)?.tutores).toEqual([{ id: 123 }])
  })

  it("em erro de auth (401), não seta error nem reseta lista", async () => {
    const errors: Array<string | null> = []
    const petsEmitted: Pet[][] = []
    const subE = facade.error$.subscribe((v) => errors.push(v))
    const subP = facade.pets$.subscribe((v) => petsEmitted.push(v))

    vi.mocked(mockService.getAll).mockRejectedValue({
      response: { status: 401 },
    })
    await facade.getAllPets(0, "")

    subE.unsubscribe()
    subP.unsubscribe()

    expect(errors.at(-1)).toBeNull()
    expect(petsEmitted.at(-1)).toEqual([])
  })

  it("deve fazer upload de foto e atualizar dados do pet", async () => {
    const mockFile = new File(["photo"], "pet.jpg", { type: "image/jpeg" })
    vi.mocked(mockService.uploadPhoto).mockResolvedValue({
      url: "http://example.com/pet.jpg",
    })
    vi.mocked(mockService.getById).mockResolvedValue({
      id: 1,
      nome: "Rex",
      especie: "Cachorro",
      raca: "Labrador",
      idade: 4,
      foto: { url: "http://example.com/pet.jpg", id: 1 },
    })

    await facade.uploadPhoto(1, mockFile)

    expect(mockService.uploadPhoto).toHaveBeenCalledWith(1, mockFile)
    expect(mockService.getById).toHaveBeenCalledWith(1)
  })

  it("deve tratar erro de upload de foto", async () => {
    const mockFile = new File(["photo"], "pet.jpg", { type: "image/jpeg" })
    const error = new Error("Upload failed")
    vi.mocked(mockService.uploadPhoto).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.uploadPhoto(1, mockFile)).rejects.toThrow(
      "Upload failed",
    )

    sub.unsubscribe()
    expect(errors).toContain("Upload failed")
  })

  it("deve excluir foto e atualizar dados do pet", async () => {
    vi.mocked(mockService.deletePhoto).mockResolvedValue(undefined)
    vi.mocked(mockService.getById).mockResolvedValue({
      id: 1,
      nome: "Rex",
      especie: "Cachorro",
      raca: "Labrador",
      idade: 4,
    })

    await facade.deletePhoto(1, 5)

    expect(mockService.deletePhoto).toHaveBeenCalledWith(1, 5)
    expect(mockService.getById).toHaveBeenCalledWith(1)
  })

  it("deve limpar pet selecionado", () => {
    const selected: Array<Pet | null> = []
    const sub = facade.selectedPet$.subscribe((value) => selected.push(value))

    facade.clearSelectedPet()

    sub.unsubscribe()
    expect(selected.at(-1)).toBeNull()
  })

  it("deve limpar erro", () => {
    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    facade.clearError()

    sub.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it("deve excluir pet e remover da lista", async () => {
    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        { id: 1, nome: "Rex", especie: "Cachorro", raca: "Lab", idade: 4 },
        { id: 2, nome: "Mia", especie: "Gato", raca: "SRD", idade: 2 },
      ],
      pageCount: 1,
      total: 2,
    })

    await facade.getAllPets(0, "")

    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.remove).mockResolvedValue(undefined)
    await facade.deletePet(1)

    sub.unsubscribe()

    expect(emitted.at(-1)?.map((p) => p.id)).toEqual([2])
  })

  it("deve tratar erro de exclusão de pet", async () => {
    const error = new Error("Delete failed")
    vi.mocked(mockService.remove).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.deletePet(1)).rejects.toThrow("Delete failed")

    sub.unsubscribe()
    expect(errors).toContain("Delete failed")
  })

  it("deve tratar erro de atualização de pet", async () => {
    const error = new Error("Update failed")
    vi.mocked(mockService.update).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(
      facade.savePet({
        id: 1,
        nome: "Rex",
        especie: "Cachorro",
        raca: "Lab",
        idade: 5,
      }),
    ).rejects.toThrow("Update failed")

    sub.unsubscribe()
    expect(errors).toContain("Update failed")
  })

  it("deve tratar erro de deletePhoto", async () => {
    const error = new Error("Delete photo failed")
    vi.mocked(mockService.deletePhoto).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(facade.deletePhoto(1, 5)).rejects.toThrow(
      "Delete photo failed",
    )

    sub.unsubscribe()
    expect(errors).toContain("Delete photo failed")
  })

  it("deve tratar erro de criação de pet", async () => {
    const error = new Error("Create failed")
    vi.mocked(mockService.create).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const sub = facade.error$.subscribe((value) => errors.push(value))

    await expect(
      facade.savePet({
        nome: "Rex",
        especie: "Cachorro",
        raca: "Lab",
        idade: 5,
      }),
    ).rejects.toThrow("Create failed")

    sub.unsubscribe()
    expect(errors).toContain("Create failed")
  })

  it("deve tratar erro de getPetById", async () => {
    const error = new Error("Failed to load pet")
    vi.mocked(mockService.getById).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const selectedEmitted: Array<Pet | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))
    const subS = facade.selectedPet$.subscribe((v) => selectedEmitted.push(v))

    await facade.getPetById(1)

    subE.unsubscribe()
    subS.unsubscribe()

    expect(errors).toContain("Failed to load pet")
    expect(selectedEmitted.at(-1)).toBeNull()
  })

  it("deve tratar erro de getAllPets", async () => {
    const error = new Error("Failed to load pets")
    vi.mocked(mockService.getAll).mockRejectedValue(error)

    const errors: Array<string | null> = []
    const petsEmitted: Pet[][] = []
    const subE = facade.error$.subscribe((v) => errors.push(v))
    const subP = facade.pets$.subscribe((v) => petsEmitted.push(v))

    await facade.getAllPets(1, "")

    subE.unsubscribe()
    subP.unsubscribe()

    expect(errors).toContain("Erro ao buscar lista de pets.")
    expect(petsEmitted.at(-1)).toEqual([])
  })

  it("em erro de auth com isAuthError flag, não seta error", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.getAll).mockRejectedValue({ isAuthError: true })
    await facade.getAllPets(0, "")

    subE.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it("em erro de auth com mensagem 'Authentication required', não seta error", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.getAll).mockRejectedValue({
      message: "Authentication required",
    })
    await facade.getAllPets(0, "")

    subE.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it("quando error não é objeto em getAllPets, seta mensagem padrão", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.getAll).mockRejectedValue("string error")
    await facade.getAllPets(0, "")

    subE.unsubscribe()
    expect(errors).toContain("Erro ao buscar lista de pets.")
  })

  it("quando error é null em getPetById, usa mensagem padrão", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.getById).mockRejectedValue(null)
    await facade.getPetById(1)

    subE.unsubscribe()
    expect(errors).toContain("Failed to load pet")
  })

  it("em erro de auth (401) em getPetById, não seta error", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.getById).mockRejectedValue({
      response: { status: 401 },
    })
    await facade.getPetById(1)

    subE.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it("em erro de auth (401) em deletePet, não seta error nem lança", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.remove).mockRejectedValue({
      response: { status: 401 },
    })
    await facade.deletePet(1)

    subE.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it("em erro de auth (401) em uploadPhoto, não seta error nem lança", async () => {
    const mockFile = new File(["photo"], "pet.jpg", { type: "image/jpeg" })
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.uploadPhoto).mockRejectedValue({
      response: { status: 401 },
    })
    await facade.uploadPhoto(1, mockFile)

    subE.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it("em erro de auth (401) em deletePhoto, não seta error nem lança", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.deletePhoto).mockRejectedValue({
      response: { status: 401 },
    })
    await facade.deletePhoto(1, 5)

    subE.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it("em erro de auth em savePet, rethrow sem setar error", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    const authError = { response: { status: 401 } }
    vi.mocked(mockService.create).mockRejectedValue(authError)

    await expect(
      facade.savePet({ nome: "X", especie: "Y", raca: "Z", idade: 1 }),
    ).rejects.toEqual(authError)

    subE.unsubscribe()
    expect(errors.at(-1)).toBeNull()
  })

  it("quando error não é Error instance em savePet, usa mensagem padrão", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.create).mockRejectedValue({ custom: "obj" })

    await expect(
      facade.savePet({ nome: "X", especie: "Y", raca: "Z", idade: 1 }),
    ).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Failed to save pet")
  })

  it("quando error não é Error instance em deletePet, usa mensagem padrão", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.remove).mockRejectedValue({ custom: "obj" })

    await expect(facade.deletePet(1)).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Failed to delete pet")
  })

  it("quando error não é Error instance em uploadPhoto, usa mensagem padrão", async () => {
    const mockFile = new File(["photo"], "pet.jpg", { type: "image/jpeg" })
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.uploadPhoto).mockRejectedValue({ custom: "obj" })

    await expect(facade.uploadPhoto(1, mockFile)).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Failed to upload photo")
  })

  it("quando error não é Error instance em deletePhoto, usa mensagem padrão", async () => {
    const errors: Array<string | null> = []
    const subE = facade.error$.subscribe((v) => errors.push(v))

    vi.mocked(mockService.deletePhoto).mockRejectedValue({ custom: "obj" })

    await expect(facade.deletePhoto(1, 5)).rejects.toBeTruthy()

    subE.unsubscribe()
    expect(errors).toContain("Failed to delete photo")
  })

  it("carrega pets com tutores associados e mapeia foto do tutor", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        {
          id: 1,
          nome: "Rex",
          especie: "Cachorro",
          raca: "Labrador",
          idade: 4,
          foto: { url: "https://example.com/rex.png" },
        },
      ],
      pageCount: 1,
      total: 1,
    })

    vi.mocked(tutoresService.getAll).mockResolvedValue({
      content: [
        {
          id: 10,
          nome: "João",
          telefone: "123",
          endereco: "Rua A",
          foto: { id: 5, url: "https://example.com/joao.png" },
        },
      ],
      pageCount: 1,
      total: 1,
    } as any)

    vi.mocked(tutoresService.getById).mockResolvedValue({
      id: 10,
      nome: "João",
      telefone: "123",
      endereco: "Rua A",
      foto: { id: 5, url: "https://example.com/joao.png" },
      pets: [
        { id: 1, nome: "Rex", especie: "Cachorro", raca: "Labrador", idade: 4 },
      ],
    } as any)

    await facade.getAllPets(0, "")
    sub.unsubscribe()

    const pet = emitted.at(-1)?.[0]
    expect(pet?.tutorId).toBe(10)
    expect(pet?.tutores?.[0]?.id).toBe(10)
    expect(pet?.tutores?.[0]?.foto?.id).toBe(5)
    expect(pet?.tutores?.[0]?.foto?.url).toBe("https://example.com/joao.png")
  })

  it("carrega pets quando getById do tutor falha", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        { id: 1, nome: "Rex", especie: "Cachorro", raca: "Labrador", idade: 4 },
      ],
      pageCount: 1,
      total: 1,
    })

    vi.mocked(tutoresService.getAll).mockResolvedValue({
      content: [{ id: 10, nome: "João", telefone: "123", endereco: "Rua A" }],
      pageCount: 1,
      total: 1,
    } as any)

    vi.mocked(tutoresService.getById).mockRejectedValue(new Error("Not found"))

    await facade.getAllPets(0, "")
    sub.unsubscribe()

    expect(emitted.at(-1)?.[0]?.id).toBe(1)
    expect(emitted.at(-1)?.[0]?.tutorId).toBeUndefined()
  })

  it("carrega pets quando tutoresService.getAll falha", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        { id: 1, nome: "Rex", especie: "Cachorro", raca: "Labrador", idade: 4 },
      ],
      pageCount: 1,
      total: 1,
    })

    vi.mocked(tutoresService.getAll).mockRejectedValue(new Error("Failed"))

    await facade.getAllPets(0, "")
    sub.unsubscribe()

    expect(emitted.at(-1)?.[0]?.id).toBe(1)
  })

  it("mapeia tutor sem foto com fotoUrl fallback", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        { id: 1, nome: "Rex", especie: "Cachorro", raca: "Labrador", idade: 4 },
      ],
      pageCount: 1,
      total: 1,
    })

    vi.mocked(tutoresService.getAll).mockResolvedValue({
      content: [
        {
          id: 10,
          nome: "João",
          telefone: "123",
          endereco: "Rua A",
          fotoUrl: "https://example.com/fallback.png",
        },
      ],
      pageCount: 1,
      total: 1,
    } as any)

    vi.mocked(tutoresService.getById).mockResolvedValue({
      id: 10,
      nome: "João",
      telefone: "123",
      endereco: "Rua A",
      fotoUrl: "https://example.com/fallback.png",
      pets: [{ id: 1, nome: "Rex" }],
    } as any)

    await facade.getAllPets(0, "")
    sub.unsubscribe()

    const pet = emitted.at(-1)?.[0]
    expect(pet?.tutores?.[0]?.fotoUrl).toBe("https://example.com/fallback.png")
    expect(pet?.tutores?.[0]?.foto).toBeUndefined()
  })

  it("trata resposta com pageCount e total undefined", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        { id: 1, nome: "Rex", especie: "Cachorro", raca: "Lab", idade: 2 },
      ],
    } as any)

    await facade.getAllPets(0, "")
    sub.unsubscribe()

    expect(emitted.at(-1)?.length).toBe(1)
  })

  it("trata content undefined no response de pets", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      pageCount: 0,
      total: 0,
    } as any)

    await facade.getAllPets(0, "")
    sub.unsubscribe()

    expect(emitted.at(-1)).toEqual([])
  })

  it("trata especie undefined no pet", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [{ id: 1, nome: "Rex", raca: "Lab", idade: 2 }],
      pageCount: 1,
      total: 1,
    } as any)

    await facade.getAllPets(0, "")
    sub.unsubscribe()

    expect(emitted.at(-1)?.[0]?.especie).toBe("")
  })

  it("trata tutores response sem content", async () => {
    const emitted: Pet[][] = []
    const sub = facade.pets$.subscribe((value) => emitted.push(value))

    vi.mocked(mockService.getAll).mockResolvedValue({
      content: [
        { id: 1, nome: "Rex", especie: "Cachorro", raca: "Lab", idade: 2 },
      ],
      pageCount: 1,
      total: 1,
    })

    vi.mocked(tutoresService.getAll).mockResolvedValue({
      pageCount: 0,
      total: 0,
    } as any)

    await facade.getAllPets(0, "")
    sub.unsubscribe()

    expect(emitted.at(-1)?.[0]?.id).toBe(1)
  })

  it("savePet sucesso seta isSaving para false", async () => {
    const savingStates: boolean[] = []
    const sub = facade.isSaving$.subscribe((value) => savingStates.push(value))

    vi.mocked(mockService.create).mockResolvedValue({
      id: 5,
      nome: "New",
      especie: "Gato",
      raca: "SRD",
      idade: 1,
    })

    await facade.savePet({
      nome: "New",
      especie: "Gato",
      raca: "SRD",
      idade: 1,
    })

    sub.unsubscribe()

    expect(savingStates).toContain(true)
    expect(savingStates.at(-1)).toBe(false)
  })

  it("savePet erro seta isSaving para false", async () => {
    const savingStates: boolean[] = []
    const sub = facade.isSaving$.subscribe((value) => savingStates.push(value))

    vi.mocked(mockService.create).mockRejectedValue(new Error("fail"))

    await facade
      .savePet({ nome: "New", especie: "Gato", raca: "SRD", idade: 1 })
      .catch(() => {})

    sub.unsubscribe()

    expect(savingStates).toContain(true)
    expect(savingStates.at(-1)).toBe(false)
  })
})
