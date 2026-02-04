import { of } from 'rxjs'
import { vi } from 'vitest'
import type { Pet } from '../../app/features/pets/models/pet.model'
import type { Tutor } from '../../app/features/tutores/models/tutor.model'
import type { LinkedPet } from '../../app/features/tutores/facades/tutores.facade'
import type { User } from '../../app/features/auth/models/user.model'
export const createMockPetsFacade = (overrides: Partial<{
  pets$: any
  selectedPet$: any
  isLoading$: any
  isSaving$: any
  error$: any
  pagination$: any
  getAllPets: any
  getPetById: any
  savePet: any
  deletePet: any
  uploadPhoto: any
  deletePhoto: any
  clearSelectedPet: any
  clearError: any
}> = {}) => ({
  pets$: of([]),
  selectedPet$: of(null),
  isLoading$: of(false),
  isSaving$: of(false),
  error$: of(null),
  pagination$: of({ page: 0, totalPages: 0, totalElements: 0 }),
  getAllPets: vi.fn().mockResolvedValue(undefined),
  getPetById: vi.fn().mockResolvedValue(undefined),
  savePet: vi.fn().mockResolvedValue({} as Pet),
  deletePet: vi.fn().mockResolvedValue(undefined),
  uploadPhoto: vi.fn().mockResolvedValue(undefined),
  deletePhoto: vi.fn().mockResolvedValue(undefined),
  clearSelectedPet: vi.fn(),
  clearError: vi.fn(),
  ...overrides
})
export const createMockTutoresFacade = (overrides: Partial<{
  tutores$: any
  selectedTutor$: any
  linkedPets$: any
  isLoading$: any
  isSaving$: any
  error$: any
  pagination$: any
  getAllTutores: any
  getTutorById: any
  saveTutor: any
  deleteTutor: any
  uploadPhoto: any
  linkPet: any
  unlinkPet: any
  deletePhoto: any
  clearSelectedTutor: any
  clearError: any
}> = {}) => ({
  tutores$: of([]),
  selectedTutor$: of(null),
  linkedPets$: of([]),
  isLoading$: of(false),
  isSaving$: of(false),
  error$: of(null),
  pagination$: of({ page: 0, totalPages: 0, totalElements: 0 }),
  getAllTutores: vi.fn().mockResolvedValue(undefined),
  getTutorById: vi.fn().mockResolvedValue(undefined),
  saveTutor: vi.fn().mockResolvedValue({} as Tutor),
  deleteTutor: vi.fn().mockResolvedValue(undefined),
  uploadPhoto: vi.fn().mockResolvedValue(undefined),
  linkPet: vi.fn().mockResolvedValue(undefined),
  unlinkPet: vi.fn().mockResolvedValue(undefined),
  deletePhoto: vi.fn().mockResolvedValue(undefined),
  clearSelectedTutor: vi.fn(),
  clearError: vi.fn(),
  ...overrides
})
export const createMockAuthFacade = (overrides: Partial<{
  user$: any
  isAuthenticated$: any
  isLoading$: any
  token$: any
  login: any
  autoLogin: any
  logout: any
  getToken: any
}> = {}) => ({
  user$: of(null),
  isAuthenticated$: of(false),
  isLoading$: of(false),
  token$: of(null),
  login: vi.fn().mockResolvedValue(undefined),
  autoLogin: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  getToken: vi.fn().mockReturnValue(null),
  ...overrides
})
export const createMockPet = (overrides: Partial<Pet> = {}): Pet => ({
  id: 1,
  nome: 'Rex',
  raca: 'Labrador',
  especie: 'Cachorro',
  idade: 3,
  tutorId: 1,
  ...overrides
})
export const createMockTutor = (overrides: Partial<Tutor> = {}): Tutor => ({
  id: 1,
  nome: 'João Silva',
  telefone: '11999999999',
  endereco: 'Rua Teste, 123',
  ...overrides
})
export const createMockLinkedPet = (overrides: Partial<LinkedPet> = {}): LinkedPet => ({
  id: 1,
  nome: 'Rex',
  especie: 'Cachorro',
  raca: 'Labrador',
  idade: 3,
  ...overrides
})
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  nome: 'Test User',
  email: 'test@example.com',
  ...overrides
})
