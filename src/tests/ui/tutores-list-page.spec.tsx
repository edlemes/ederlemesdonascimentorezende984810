import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { BehaviorSubject } from 'rxjs'

import { TutoresListPage } from '../../app/features/tutores/pages/TutoresListPage'
import { tutoresFacade } from '../../app/features/tutores/facades/tutores.facade'
import { authFacade } from '../../app/features/auth/facades/auth.facade'
import type { Tutor } from '../../app/features/tutores/models/tutor.model'

const mockTutores: Tutor[] = [
  {
    id: 1,
    nome: 'João Silva',
    telefone: '(65) 98765-4321',
    endereco: 'Rua das Flores, 123',
    fotoUrl: 'https://example.com/joao.jpg',
  },
  {
    id: 2,
    nome: 'Maria Santos',
    telefone: '(65) 91234-5678',
    endereco: 'Avenida Principal, 456',
  },
]

vi.mock('../../app/features/tutores/facades/tutores.facade', () => ({
  tutoresFacade: {
    tutores$: new BehaviorSubject<Tutor[]>([]),
    isLoading$: new BehaviorSubject<boolean>(false),
    pagination$: new BehaviorSubject({ page: 1, totalPages: 1 }),
    getAllTutores: vi.fn(),
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

describe('TutoresListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next([])
    ;(tutoresFacade.isLoading$ as BehaviorSubject<boolean>).next(false)
    ;(tutoresFacade.pagination$ as BehaviorSubject<any>).next({ page: 1, totalPages: 1 })
    ;(authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(true)
  })

  it('renderiza título da página', () => {
    renderWithRouter(<TutoresListPage />)

    expect(screen.getByText('Tutores')).toBeTruthy()
    expect(screen.getByText('Gerencie os tutores cadastrados')).toBeTruthy()
  })

  it('renderiza campo de busca', () => {
    renderWithRouter(<TutoresListPage />)

    const searchInput = screen.getByPlaceholderText('Buscar por nome...')
    expect(searchInput).toBeTruthy()
  })

  it('renderiza botão de adicionar tutor', () => {
    renderWithRouter(<TutoresListPage />)

    const addButton = screen.getByText('+ Novo Tutor')
    expect(addButton).toBeTruthy()
  })

  it('exibe spinner quando está carregando', () => {
    ;(tutoresFacade.isLoading$ as BehaviorSubject<boolean>).next(true)

    const { container } = renderWithRouter(<TutoresListPage />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('renderiza lista de tutores quando há dados', async () => {
    ;(tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)

    renderWithRouter(<TutoresListPage />)

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeTruthy()
      expect(screen.getByText('Maria Santos')).toBeTruthy()
    })
  })

  it('renderiza EmptyState quando não há tutores', () => {
    ;(tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next([])

    renderWithRouter(<TutoresListPage />)

    expect(screen.getByText('Nenhum tutor encontrado')).toBeTruthy()
  })

  it('chama getAllTutores ao buscar', async () => {
    renderWithRouter(<TutoresListPage />)

    const searchInput = screen.getByPlaceholderText('Buscar por nome...')
    fireEvent.change(searchInput, { target: { value: 'João' } })

    await waitFor(() => {
      expect(tutoresFacade.getAllTutores).toHaveBeenCalledWith(1, 'João')
    }, { timeout: 1000 })
  })

  it('renderiza paginação quando há múltiplas páginas', async () => {
    ;(tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)
    ;(tutoresFacade.pagination$ as BehaviorSubject<any>).next({ page: 1, totalPages: 3 })

    renderWithRouter(<TutoresListPage />)

    await waitFor(() => {
      expect(screen.queryByText('Anterior')).toBeTruthy()
    })
  })

  it('chama getAllTutores ao mudar de página', async () => {
    ;(tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)
    ;(tutoresFacade.pagination$ as BehaviorSubject<any>).next({ page: 1, totalPages: 3 })

    renderWithRouter(<TutoresListPage />)

    await waitFor(() => {
      const nextButton = screen.queryByText('Próxima')
      if (nextButton) fireEvent.click(nextButton)
    })

    await waitFor(() => {
      expect(tutoresFacade.getAllTutores).toHaveBeenCalled()
    })
  })

  it('limpa busca ao clicar no botão de limpar', async () => {
    const { container } = renderWithRouter(<TutoresListPage />)

    const searchInput = screen.getByPlaceholderText('Buscar por nome...') as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'João' } })

    expect(searchInput.value).toBe('João')

    const clearButton = container.querySelector('button[class*="absolute right-3"]') as HTMLButtonElement
    fireEvent.click(clearButton)

    expect(searchInput.value).toBe('')
  })

  it('aguarda autenticação antes de carregar tutores', () => {
    ;(authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(false)

    renderWithRouter(<TutoresListPage />)

    expect(tutoresFacade.getAllTutores).not.toHaveBeenCalled()
  })

  it('renderiza telefone do tutor nos cards', async () => {
    ;(tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)

    renderWithRouter(<TutoresListPage />)

    await waitFor(() => {
      expect(screen.getByText('(65) 98765-4321')).toBeTruthy()
    })
  })

  it('renderiza endereço do tutor nos cards', async () => {
    ;(tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)

    renderWithRouter(<TutoresListPage />)

    await waitFor(() => {
      expect(screen.getByText(/Rua das Flores, 123/i)).toBeTruthy()
    })
  })

  it('aplica scroll suave ao mudar de página', async () => {
    ;(tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)
    ;(tutoresFacade.pagination$ as BehaviorSubject<any>).next({ page: 1, totalPages: 3 })

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    renderWithRouter(<TutoresListPage />)

    await waitFor(() => {
      const nextButton = screen.queryByText('Próximo')
      expect(nextButton).toBeTruthy()
      if (nextButton) fireEvent.click(nextButton)
    })

    await waitFor(() => {
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
  })
})
