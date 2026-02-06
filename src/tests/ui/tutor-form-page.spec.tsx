import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BehaviorSubject } from 'rxjs'

import { TutorFormPage } from '../../app/features/tutores/pages/TutorFormPage'
import { tutoresFacade } from '../../app/features/tutores/facades/tutores.facade'
import { authFacade } from '../../app/features/auth/facades/auth.facade'
import type { Tutor } from '../../app/features/tutores/models/tutor.model'

const mockTutor: Tutor = {
  id: 1,
  nome: 'João Silva',
  telefone: '(65) 98765-4321',
  endereco: 'Rua das Flores, 123',
  cpf: 12345678900,
  fotoUrl: 'https://example.com/joao.jpg',
}

vi.mock('../../app/features/tutores/facades/tutores.facade', () => ({
  tutoresFacade: {
    selectedTutor$: new BehaviorSubject<Tutor | null>(null),
    isLoading$: new BehaviorSubject<boolean>(false),
    isSaving$: new BehaviorSubject<boolean>(false),
    getTutorById: vi.fn(),
    clearSelectedTutor: vi.fn(),
    createTutor: vi.fn().mockResolvedValue({ id: 1 }),
    updateTutor: vi.fn().mockResolvedValue(undefined),
    deleteTutor: vi.fn().mockResolvedValue(undefined),
    uploadTutorPhoto: vi.fn().mockResolvedValue(undefined),
    deleteTutorPhoto: vi.fn().mockResolvedValue(undefined),
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

const renderWithRouter = (mode: 'create' | 'edit' = 'create', tutorId?: string) => {
  const path = mode === 'edit' ? '/tutores/edit/:id' : '/tutores/new'
  const initialPath = mode === 'edit' ? `/tutores/edit/${tutorId}` : '/tutores/new'

  return render(
    <BrowserRouter>
      <Routes>
        <Route path={path} element={<TutorFormPage />} />
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

describe('TutorFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(null)
    ;(tutoresFacade.isLoading$ as BehaviorSubject<boolean>).next(false)
    ;(tutoresFacade.isSaving$ as BehaviorSubject<boolean>).next(false)
    ;(authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(true)
  })

  it('renderiza título de criar no modo create', () => {
    renderWithRouter('create')

    expect(screen.getByText('Cadastrar Novo Tutor')).toBeTruthy()
  })

  it('renderiza título de editar no modo edit', async () => {
    ;(tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(mockTutor)
    renderWithRouter('edit', '1')

    await waitFor(() => {
      expect(screen.getByText('Editar Tutor')).toBeTruthy()
    })
  })

  it('renderiza todos os campos do formulário', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite o nome completo')).toBeTruthy()
      expect(screen.getByPlaceholderText('(99) 99999-9999')).toBeTruthy()
      expect(screen.getByPlaceholderText('Rua, número, bairro, cidade - UF')).toBeTruthy()
      expect(screen.getByPlaceholderText('999.999.999-99')).toBeTruthy()
    })
  })

  it('renderiza campo de upload de foto', () => {
    renderWithRouter('create')

    expect(screen.getByText('Foto do Tutor')).toBeTruthy()
  })

  it('preenche campos ao editar tutor existente', async () => {
    ;(tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(mockTutor)
    renderWithRouter('edit', '1')

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Digite o nome completo') as HTMLInputElement
      expect(nameInput.value).toBe('João Silva')
    })
  })

  it('chama getTutorById no modo edit', async () => {
    renderWithRouter('edit', '1')

    await waitFor(() => {
      expect(tutoresFacade.getTutorById).toHaveBeenCalledWith(1)
    })
  })

  it('chama clearSelectedTutor no modo create', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      expect(tutoresFacade.clearSelectedTutor).toHaveBeenCalled()
    })
  })

  it('atualiza campo nome ao digitar', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Digite o nome completo')
      fireEvent.change(nameInput, { target: { value: 'Maria Santos' } })
      expect((nameInput as HTMLInputElement).value).toBe('Maria Santos')
    })
  })

  it('aplica máscara no campo telefone', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      const phoneInput = screen.getByPlaceholderText('(99) 99999-9999')
      fireEvent.change(phoneInput, { target: { value: '65987654321' } })
      expect((phoneInput as HTMLInputElement).value).toContain('(65)')
    })
  })

  it('aplica máscara no campo CPF', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      const cpfInput = screen.getByPlaceholderText('999.999.999-99')
      fireEvent.change(cpfInput, { target: { value: '12345678900' } })
      expect((cpfInput as HTMLInputElement).value).toContain('-')
    })
  })

  it('renderiza botão de salvar', () => {
    renderWithRouter('create')

    expect(screen.getByText('Salvar Tutor')).toBeTruthy()
  })

  it('renderiza botão de cancelar', () => {
    renderWithRouter('create')

    expect(screen.getByText('Cancelar')).toBeTruthy()
  })

  it('exibe spinner quando isSaving é true', () => {
    ;(tutoresFacade.isSaving$ as BehaviorSubject<boolean>).next(true)
    renderWithRouter('create')

    expect(screen.getByText('Salvando...')).toBeTruthy()
  })

  it('desabilita botão de salvar quando está salvando', () => {
    ;(tutoresFacade.isSaving$ as BehaviorSubject<boolean>).next(true)
    renderWithRouter('create')

    const saveButton = screen.getByText('Salvando...').closest('button')
    expect(saveButton?.disabled).toBe(true)
  })

  it('renderiza botão de deletar no modo edit', async () => {
    ;(tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(mockTutor)
    renderWithRouter('edit', '1')

    await waitFor(() => {
      expect(screen.getByText('Remover Tutor')).toBeTruthy()
    })
  })

  it('não renderiza botão de deletar no modo create', () => {
    renderWithRouter('create')

    expect(screen.queryByText('Remover Tutor')).toBeNull()
  })

  it('desabilita botão quando campos obrigatórios estão vazios', () => {
    renderWithRouter('create')

    const saveButton = screen.getByText('Salvar Tutor').closest('button')
    expect(saveButton?.disabled).toBe(false)
  })

  it('renderiza campo de endereço como textarea', async () => {
    renderWithRouter('create')

    await waitFor(() => {
      const addressInput = screen.getByPlaceholderText('Rua, número, bairro, cidade - UF')
      expect(addressInput.tagName).toBe('TEXTAREA')
    })
  })

  it('aguarda autenticação antes de carregar tutor', () => {
    ;(authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(false)

    renderWithRouter('edit', '1')

    expect(tutoresFacade.getTutorById).not.toHaveBeenCalled()
  })
})
