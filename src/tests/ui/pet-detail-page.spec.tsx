import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BehaviorSubject } from 'rxjs'

import { PetDetailPage } from '../../app/features/pets/pages/PetDetailPage'
import { petsFacade } from '../../app/features/pets/facades/pets.facade'
import { authFacade } from '../../app/features/auth/facades/auth.facade'
import type { Pet } from '../../app/features/pets/models/pet.model'

const mockPet: Pet = {
  id: 1,
  nome: 'Rex',
  especie: 'Cachorro',
  raca: 'Labrador',
  idade: 3,
  fotoUrl: 'https://example.com/rex.jpg',
  tutores: [
    {
      id: 1,
      nome: 'João Silva',
      telefone: '(65) 98765-4321',
    },
  ],
}

vi.mock('../../app/features/pets/facades/pets.facade', () => ({
  petsFacade: {
    selectedPet$: new BehaviorSubject<Pet | null>(null),
    isLoading$: new BehaviorSubject<boolean>(false),
    getPetById: vi.fn(),
    clearSelectedPet: vi.fn(),
    deletePet: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../app/features/auth/facades/auth.facade', () => ({
  authFacade: {
    isAuthenticated$: new BehaviorSubject<boolean>(true),
    autoLogin: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../app/features/tutores/facades/tutores.facade', () => ({
  tutoresFacade: {
    unlinkPet: vi.fn().mockResolvedValue(undefined),
  },
}))

const renderWithRouter = (petId: string = '1') => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/:id" element={<PetDetailPage />} />
      </Routes>
    </BrowserRouter>,
    { wrapper: ({ children }) => {
      window.history.pushState({}, '', `/${petId}`)
      return <>{children}</>
    }}
  )
}

describe('PetDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(null)
    ;(petsFacade.isLoading$ as BehaviorSubject<boolean>).next(false)
    ;(authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(true)
  })

  it('chama getPetById ao montar com id', async () => {
    renderWithRouter('1')

    await waitFor(() => {
      expect(petsFacade.getPetById).toHaveBeenCalledWith(1)
    })
  })

  it('exibe spinner quando está carregando', () => {
    ;(petsFacade.isLoading$ as BehaviorSubject<boolean>).next(true)

    renderWithRouter()

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('renderiza detalhes do pet', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('Rex')).toBeTruthy()
      expect(screen.getByText(/Labrador/i)).toBeTruthy()
      expect(screen.getByText(/3 anos/i)).toBeTruthy()
    })
  })

  it('renderiza imagem do pet quando existe', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)

    renderWithRouter()

    await waitFor(() => {
      const img = screen.getByAltText('Rex')
      expect(img.getAttribute('src')).toBe('https://example.com/rex.jpg')
    })
  })

  it('renderiza lista de tutores vinculados', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeTruthy()
      expect(screen.getByText('(65) 98765-4321')).toBeTruthy()
    })
  })

  it('renderiza link de edição', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)

    renderWithRouter()

    await waitFor(() => {
      const editLink = document.querySelector('a[href="/1/editar"]')
      expect(editLink).toBeTruthy()
    })
  })

  it('renderiza link para vincular tutor', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('+ Adicionar')).toBeTruthy()
    })
  })

  it('exibe tutor vinculado', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeTruthy()
      expect(screen.getByText('(65) 98765-4321')).toBeTruthy()
    })
  })

  it('renderiza botão de vincular tutor quando não tem tutor', async () => {
    const petSemTutor = { ...mockPet, tutores: [] }
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(petSemTutor)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText(/Encontre um tutor para/i)).toBeTruthy()
    })
  })

  it('chama clearSelectedPet ao desmontar', () => {
    const { unmount } = renderWithRouter()

    unmount()

    expect(petsFacade.clearSelectedPet).toHaveBeenCalled()
  })

  it('abre modal ao clicar em desvincular tutor', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)

    renderWithRouter()

    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      const unlinkButton = buttons.find(btn => 
        btn.className.includes('bg-white hover:bg-red-50')
      )
      if (unlinkButton) fireEvent.click(unlinkButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Desvincular Tutor')).toBeTruthy()
    })
  })

  it('aguarda autenticação antes de buscar pet', () => {
    ;(authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(false)

    renderWithRouter()

    expect(petsFacade.getPetById).not.toHaveBeenCalled()
  })
})
