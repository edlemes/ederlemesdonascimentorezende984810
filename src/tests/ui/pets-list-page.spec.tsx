import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { BehaviorSubject } from 'rxjs'

import { PetsListPage } from '../../app/features/pets/pages/PetsListPage'
import { petsFacade } from '../../app/features/pets/facades/pets.facade'
import { authFacade } from '../../app/features/auth/facades/auth.facade'
import type { Pet } from '../../app/features/pets/models/pet.model'

const mockPets: Pet[] = [
  {
    id: 1,
    nome: 'Rex',
    especie: 'Cachorro',
    raca: 'Labrador',
    idade: 3,
    fotoUrl: 'https://example.com/rex.jpg',
  },
  {
    id: 2,
    nome: 'Miau',
    especie: 'Gato',
    raca: 'Siamês',
    idade: 2,
  },
]

vi.mock('../../app/features/pets/facades/pets.facade', () => ({
  petsFacade: {
    pets$: new BehaviorSubject<Pet[]>([]),
    isLoading$: new BehaviorSubject<boolean>(false),
    pagination$: new BehaviorSubject({ page: 1, totalPages: 1 }),
    getAllPets: vi.fn(),
  },
}))

vi.mock('../../app/features/auth/facades/auth.facade', () => ({
  authFacade: {
    isAuthenticated$: new BehaviorSubject<boolean>(true),
    autoLogin: vi.fn().mockResolvedValue(undefined),
  },
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('PetsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(petsFacade.pets$ as BehaviorSubject<Pet[]>).next([])
    ;(petsFacade.isLoading$ as BehaviorSubject<boolean>).next(false)
    ;(petsFacade.pagination$ as BehaviorSubject<any>).next({ page: 1, totalPages: 1 })
    ;(authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(true)
  })

  it('renderiza título da página', () => {
    renderWithRouter(<PetsListPage />)

    expect(screen.getByText('Pets Disponíveis')).toBeTruthy()
    expect(screen.getByText('Encontre seu novo amigo')).toBeTruthy()
  })

  it('renderiza campo de busca', () => {
    renderWithRouter(<PetsListPage />)

    const searchInput = screen.getByPlaceholderText('Buscar por nome...')
    expect(searchInput).toBeTruthy()
  })

  it('renderiza botão de adicionar pet', () => {
    renderWithRouter(<PetsListPage />)

    const addButton = screen.getByText('+ Novo Pet')
    expect(addButton).toBeTruthy()
  })

  it('exibe spinner quando está carregando', () => {
    ;(petsFacade.isLoading$ as BehaviorSubject<boolean>).next(true)

    const { container } = renderWithRouter(<PetsListPage />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('renderiza lista de pets quando há dados', async () => {
    ;(petsFacade.pets$ as BehaviorSubject<Pet[]>).next(mockPets)

    renderWithRouter(<PetsListPage />)

    await waitFor(() => {
      expect(screen.getByText('Rex')).toBeTruthy()
      expect(screen.getByText('Miau')).toBeTruthy()
    })
  })

  it('renderiza EmptyState quando não há pets', () => {
    ;(petsFacade.pets$ as BehaviorSubject<Pet[]>).next([])

    renderWithRouter(<PetsListPage />)

    expect(screen.getByText('Nenhum pet encontrado')).toBeTruthy()
  })

  it('chama getAllPets ao buscar', async () => {
    renderWithRouter(<PetsListPage />)

    const searchInput = screen.getByPlaceholderText('Buscar por nome...')
    fireEvent.change(searchInput, { target: { value: 'Rex' } })

    await waitFor(() => {
      expect(petsFacade.getAllPets).toHaveBeenCalledWith(1, 'Rex')
    }, { timeout: 1000 })
  })

  it('renderiza paginação quando há múltiplas páginas', async () => {
    ;(petsFacade.pets$ as BehaviorSubject<Pet[]>).next([mockPets[0]])
    ;(petsFacade.pagination$ as BehaviorSubject<any>).next({ page: 1, totalPages: 3 })

    renderWithRouter(<PetsListPage />)

    await waitFor(() => {
      expect(screen.queryByText('Anterior')).toBeTruthy()
    })
  })

  it('chama getAllPets ao mudar de página', async () => {
    ;(petsFacade.pets$ as BehaviorSubject<Pet[]>).next([mockPets[0]])
    ;(petsFacade.pagination$ as BehaviorSubject<any>).next({ page: 1, totalPages: 3 })

    renderWithRouter(<PetsListPage />)

    await waitFor(() => {
      const nextButton = screen.queryByText('Próximo')
      if (nextButton) fireEvent.click(nextButton)
    })

    await waitFor(() => {
      expect(petsFacade.getAllPets).toHaveBeenCalled()
    })
  })

  it('limpa busca ao clicar no botão de limpar', async () => {
    const { container } = renderWithRouter(<PetsListPage />)

    const searchInput = screen.getByPlaceholderText('Buscar por nome...') as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'Rex' } })

    expect(searchInput.value).toBe('Rex')

    await waitFor(() => {
      const clearButton = container.querySelector('.absolute.right-3 button, button.absolute')
      if (clearButton) {
        fireEvent.click(clearButton)
      }
    })

    await waitFor(() => {
      expect(searchInput.value).toBe('')
    })
  })

  it('aguarda autenticação antes de carregar pets', () => {
    ;(authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(false)

    renderWithRouter(<PetsListPage />)

    expect(petsFacade.getAllPets).not.toHaveBeenCalled()
  })
})
