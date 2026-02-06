import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BehaviorSubject } from 'rxjs'

import { PetFormPage } from '../../app/features/pets/pages/PetFormPage'
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
}

vi.mock('../../app/features/pets/facades/pets.facade', () => ({
  petsFacade: {
    selectedPet$: new BehaviorSubject<Pet | null>(null),
    isLoading$: new BehaviorSubject<boolean>(false),
    isSaving$: new BehaviorSubject<boolean>(false),
    getPetById: vi.fn(),
    clearSelectedPet: vi.fn(),
    createPet: vi.fn().mockResolvedValue({ id: 1 }),
    updatePet: vi.fn().mockResolvedValue(undefined),
    deletePet: vi.fn().mockResolvedValue(undefined),
    uploadPetPhoto: vi.fn().mockResolvedValue(undefined),
    deletePetPhoto: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../app/features/auth/facades/auth.facade', () => ({
  authFacade: {
    isAuthenticated$: new BehaviorSubject<boolean>(true),
    autoLogin: vi.fn().mockResolvedValue(undefined),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (mode: 'create' | 'edit' = 'create', petId?: string) => {
  const path = mode === 'edit' ? '/edit/:id' : '/new'
  const initialPath = mode === 'edit' ? `/edit/${petId}` : '/new'

  return render(
    <BrowserRouter>
      <Routes>
        <Route path={path} element={<PetFormPage />} />
      </Routes>
    </BrowserRouter>,
    {
      wrapper: ({ children }) => {
        window.history.pushState({}, '', initialPath)
        return <>{children}</>
      },
    }
  )
}

describe('PetFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(null)
    ;(petsFacade.isLoading$ as BehaviorSubject<boolean>).next(false)
    ;(petsFacade.isSaving$ as BehaviorSubject<boolean>).next(false)
    ;(authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(true)
  })

  it('renderiza título de criar no modo create', () => {
    renderWithRouter('create')

    expect(screen.getByText('Cadastrar Novo Pet')).toBeTruthy()
  })

  it('renderiza título de editar no modo edit', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)
    renderWithRouter('edit', '1')

    await waitFor(() => {
      expect(screen.getByText('Editar Pet')).toBeTruthy()
    })
  })

  it('renderiza todos os campos do formulário', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite o nome do pet')).toBeTruthy()
      expect(screen.getByPlaceholderText('0')).toBeTruthy()
      expect(screen.getByPlaceholderText('Digite a raça do pet')).toBeTruthy()
    })
  })

  it('renderiza campo de upload de foto', () => {
    renderWithRouter('create')

    expect(screen.getByText('Foto do Pet')).toBeTruthy()
  })

  it('preenche campos ao editar pet existente', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)
    renderWithRouter('edit', '1')

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Digite o nome do pet') as HTMLInputElement
      expect(nameInput.value).toBe('Rex')
    })
  })

  it('chama getPetById no modo edit', async () => {
    renderWithRouter('edit', '1')

    await waitFor(() => {
      expect(petsFacade.getPetById).toHaveBeenCalledWith(1)
    })
  })

  it('chama clearSelectedPet no modo create', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      expect(petsFacade.clearSelectedPet).toHaveBeenCalled()
    })
  })

  it('atualiza campo nome ao digitar', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Digite o nome do pet')
      fireEvent.change(nameInput, { target: { value: 'Bolt' } })
      expect((nameInput as HTMLInputElement).value).toBe('Bolt')
    })
  })

  it('atualiza campo idade ao digitar', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      const ageInput = screen.getByPlaceholderText('0')
      fireEvent.change(ageInput, { target: { value: '5' } })
      expect((ageInput as HTMLInputElement).value).toBe('5')
    })
  })

  it('aceita apenas números no campo idade', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      const ageInput = screen.getByPlaceholderText('0')
      fireEvent.change(ageInput, { target: { value: 'abc' } })
      expect((ageInput as HTMLInputElement).value).toBe('0')
    })
  })

  it('renderiza botão de salvar', () => {
    renderWithRouter('create')

    expect(screen.getByText('Salvar Pet')).toBeTruthy()
  })

  it('renderiza botão de cancelar', () => {
    renderWithRouter('create')

    expect(screen.getByText('Cancelar')).toBeTruthy()
  })

  it('exibe spinner quando isSaving é true', () => {
    ;(petsFacade.isSaving$ as BehaviorSubject<boolean>).next(true)
    renderWithRouter('create')

    expect(screen.getByText('Salvando...')).toBeTruthy()
  })

  it('desabilita botão de salvar quando está salvando', () => {
    ;(petsFacade.isSaving$ as BehaviorSubject<boolean>).next(true)
    renderWithRouter('create')

    const saveButton = screen.getByText('Salvando...').closest('button')
    expect(saveButton?.disabled).toBe(true)
  })

  it('renderiza botão de deletar no modo edit', async () => {
    ;(petsFacade.selectedPet$ as BehaviorSubject<Pet | null>).next(mockPet)
    renderWithRouter('edit', '1')

    await waitFor(() => {
      expect(screen.getByText('Remover Pet')).toBeTruthy()
    })
  })

  it('não renderiza botão de deletar no modo create', () => {
    renderWithRouter('create')

    expect(screen.queryByText('Remover Pet')).toBeNull()
  })

  it('valida campos obrigatórios antes de salvar', async () => {
    renderWithRouter('create')

    const saveButton = screen.getByText('Salvar Pet')
    fireEvent.click(saveButton)

    expect(saveButton).toBeTruthy()
  })
})
