import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { BehaviorSubject } from "rxjs"

import { LinkTutorPage } from "../../app/features/pets/pages/LinkTutorPage"
import { tutoresFacade } from "../../app/features/tutores/facades/tutores.facade"
import { authFacade } from "../../app/features/auth/facades/auth.facade"
import type { Tutor } from "../../app/features/tutores/models/tutor.model"

const mockTutores: Tutor[] = [
  {
    id: 1,
    nome: "João Silva",
    telefone: "(65) 98765-4321",
    endereco: "Rua das Flores, 123",
  },
  {
    id: 2,
    nome: "Maria Santos",
    telefone: "(65) 91234-5678",
    endereco: "Avenida Principal, 456",
  },
]

vi.mock("../../app/features/tutores/facades/tutores.facade", () => ({
  tutoresFacade: {
    tutores$: new BehaviorSubject<Tutor[]>([]),
    isLoading$: new BehaviorSubject<boolean>(false),
    pagination$: new BehaviorSubject({ page: 1, totalPages: 1 }),
    getAllTutores: vi.fn(),
    linkPet: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock("../../app/features/auth/facades/auth.facade", () => ({
  authFacade: {
    isAuthenticated$: new BehaviorSubject<boolean>(true),
    autoLogin: vi.fn().mockResolvedValue(undefined),
  },
}))

const renderWithRouter = (petId: string = "1") => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/:id/link-tutor" element={<LinkTutorPage />} />
      </Routes>
    </BrowserRouter>,
    {
      wrapper: ({ children }) => {
        window.history.pushState({}, "", `/${petId}/link-tutor`)
        return <>{children}</>
      },
    },
  )
}

describe("LinkTutorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next([]);
    (tutoresFacade.isLoading$ as BehaviorSubject<boolean>).next(false);
    (tutoresFacade.pagination$ as BehaviorSubject<any>).next({
      page: 1,
      totalPages: 1,
    });
    (authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(true)
  })

  it("renderiza título da página", () => {
    renderWithRouter()

    expect(screen.getByText("Vincular Tutor")).toBeTruthy()
  })

  it("renderiza campo de busca", () => {
    renderWithRouter()

    expect(
      screen.getByPlaceholderText("Buscar tutor por nome..."),
    ).toBeTruthy()
  })

  it("chama getAllTutores ao montar", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(tutoresFacade.getAllTutores).toHaveBeenCalled()
    })
  })

  it("exibe skeleton quando está carregando", () => {
    (tutoresFacade.isLoading$ as BehaviorSubject<boolean>).next(true)

    const { container } = renderWithRouter()

    const skeleton = container.querySelector(".animate-pulse")
    expect(skeleton).toBeTruthy()
  })

  it("renderiza lista de tutores quando há dados", async () => {
    renderWithRouter();
    (tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeTruthy()
      expect(screen.getByText("Maria Santos")).toBeTruthy()
    })
  })

  it("renderiza botão de vincular para cada tutor", async () => {
    renderWithRouter();

    (tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)

    await waitFor(() => {
      const linkButtons = screen.getAllByRole("button", {
        name: /vincular tutor/i,
      })
      expect(linkButtons.length).toBe(2)
    })
  })

  it("abre modal de confirmação ao clicar em vincular", async () => {
    renderWithRouter();
    (tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeTruthy()
    })

    const linkButton = screen.getAllByRole("button", {
      name: /vincular tutor/i,
    })[0]
    fireEvent.click(linkButton)

    await waitFor(() => {
      expect(screen.getByText(/deseja vincular/i)).toBeTruthy()
    })
  })

  it("chama linkPet ao confirmar vinculação", async () => {
    renderWithRouter("1");
    (tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeTruthy()
    })

    const linkButton = screen.getAllByRole("button", {
      name: /vincular tutor/i,
    })[0]
    fireEvent.click(linkButton)

    await waitFor(() => {
      expect(screen.getByText(/deseja vincular/i)).toBeTruthy()
    })

    const modalButtons = screen.getAllByRole("button")
    const confirmButton = modalButtons.find(
      (btn) => btn.textContent?.trim() === "Vincular",
    )
    fireEvent.click(confirmButton!)

    await waitFor(() => {
      expect(tutoresFacade.linkPet).toHaveBeenCalledWith(1, 1)
    })
  })

  it("chama getAllTutores ao buscar", async () => {
    renderWithRouter()

    const searchInput = screen.getByPlaceholderText("Buscar tutor por nome...")
    fireEvent.change(searchInput, { target: { value: "João" } })

    await waitFor(
      () => {
        expect(tutoresFacade.getAllTutores).toHaveBeenCalledWith(1, "João")
      },
      { timeout: 1000 },
    )
  })

  it("renderiza paginação quando há múltiplas páginas", async () => {
    renderWithRouter();
    (tutoresFacade.pagination$ as BehaviorSubject<any>).next({
      page: 1,
      totalPages: 3,
    });
    (tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeTruthy()
    })

    const prevButton = screen.getByRole("button", { name: /anterior/i })
    expect(prevButton).toBeTruthy()
  })

  it("renderiza mensagem quando não há tutores", () => {
    (tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next([])

    renderWithRouter()

    expect(screen.getByText("Nenhum tutor encontrado")).toBeTruthy()
  })

  it("renderiza botão de voltar", () => {
    renderWithRouter()

    expect(screen.getByText("Voltar ao pet")).toBeTruthy()
  })

  it("desabilita botões durante vinculação", async () => {
    renderWithRouter();
    (tutoresFacade.tutores$ as BehaviorSubject<Tutor[]>).next(mockTutores)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeTruthy()
    })

    const linkButton = screen.getAllByRole("button", {
      name: /vincular tutor/i,
    })[0]
    fireEvent.click(linkButton)

    await waitFor(() => {
      expect(screen.getByText(/deseja vincular/i)).toBeTruthy()
    })

    const modalButtons = screen.getAllByRole("button")
    const confirmButton = modalButtons.find(
      (btn) => btn.textContent?.trim() === "Vincular",
    )
    fireEvent.click(confirmButton!)

    await waitFor(() => {
      const buttons = screen.getAllByRole("button", {
        name: /vincular tutor/i,
      })
      buttons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })
  })

  it("aguarda autenticação antes de carregar tutores", () => {
    (authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(false)

    renderWithRouter()

    expect(tutoresFacade.getAllTutores).not.toHaveBeenCalled()
  })
})