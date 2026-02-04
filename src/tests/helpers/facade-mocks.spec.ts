import { describe, expect, it, vi } from 'vitest'
import { of } from 'rxjs'

import {
  createMockAuthFacade,
  createMockLinkedPet,
  createMockPet,
  createMockPetsFacade,
  createMockTutor,
  createMockTutoresFacade,
  createMockUser,
} from './facade-mocks'

describe('facade-mocks helpers', () => {
  it('cria mocks de facade com defaults e overrides', async () => {
    const petsFacade = createMockPetsFacade({
      isLoading$: of(true),
      savePet: vi.fn().mockResolvedValue(createMockPet({ id: 99 })),
    })

    const authFacade = createMockAuthFacade({
      isAuthenticated$: of(true),
      getToken: vi.fn().mockReturnValue('t'),
    })

    const tutoresFacade = createMockTutoresFacade({
      isSaving$: of(true),
    })

    expect(petsFacade).toHaveProperty('getAllPets')
    expect(authFacade).toHaveProperty('login')
    expect(tutoresFacade).toHaveProperty('getAllTutores')
  })

  it('cria entities mock com overrides', () => {
    expect(createMockPet({ id: 2 }).id).toBe(2)
    expect(createMockTutor({ nome: 'Maria' }).nome).toBe('Maria')
    expect(createMockLinkedPet({ nome: 'Bidu' }).nome).toBe('Bidu')
    expect(createMockUser({ email: 'a@b.com' }).email).toBe('a@b.com')
  })
})
