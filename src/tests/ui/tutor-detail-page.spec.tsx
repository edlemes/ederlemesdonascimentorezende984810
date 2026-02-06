import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { BehaviorSubject } from "rxjs"

import { TutorDetailPage } from "../../app/features/tutores/pages/TutorDetailPage"
import { tutoresFacade } from "../../app/features/tutores/facades/tutores.facade"
import { authFacade } from "../../app/features/auth/facades/auth.facade"
import type { Tutor } from "../../app/features/tutores/models/tutor.model"
import type { LinkedPet } from "../../app/features/tutores/facades/tutores.facade"

const mockTutor: Tutor = {
  id: 1,
  nome: "João Silva",
  telefone: "(65) 98765-4321",
  endereco: "Rua das Flores, 123",
  fotoUrl: "https://example.com/joao.jpg",
}

const mockLinkedPets: LinkedPet[] = [
  {
    id: 1,
    nome: "Rex",
    especie: "Cachorro",
    raca: "Labrador",
    idade: 3,
    fotoUrl: "https://example.com/rex.jpg",
  },
]

vi.mock("../../app/features/tutores/facades/tutores.facade", () => ({
  tutoresFacade: {
    selectedTutor$: new BehaviorSubject<Tutor | null>(null),
    linkedPets$: new BehaviorSubject<LinkedPet[]>([]),
    isLoading$: new BehaviorSubject<boolean>(false),
    getTutorById: vi.fn(),
    clearSelectedTutor: vi.fn(),
    deleteTutor: vi.fn().mockResolvedValue(undefined),
    unlinkPet: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock("../../app/features/auth/facades/auth.facade", () => ({
  authFacade: {
    isAuthenticated$: new BehaviorSubject<boolean>(true),
    autoLogin: vi.fn().mockResolvedValue(undefined),
  },
}))

const renderWithRouter = (tutorId: string = "1") => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/tutores/:id" element={<TutorDetailPage />} />
      </Routes>
    </BrowserRouter>,
    {
      wrapper: ({ children }) => {
        window.history.pushState({}, "", `/tutores/${tutorId}`)
        return <>{children}</>
      },
    },
  )
}

describe("TutorDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(null);
    (tutoresFacade.linkedPets$ as BehaviorSubject<LinkedPet[]>).next([]);
    (tutoresFacade.isLoading$ as BehaviorSubject<boolean>).next(false);
    (authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(true)
  })

  it("chama getTutorById ao montar com id", async () => {
    renderWithRouter("1")

    await waitFor(() => {
      expect(tutoresFacade.getTutorById).toHaveBeenCalledWith(1)
    })
  })

  it("exibe spinner quando está carregando", () => {
    (tutoresFacade.isLoading$ as BehaviorSubject<boolean>).next(true)

    renderWithRouter()

    const spinner = document.querySelector(".animate-spin")
    expect(spinner).toBeTruthy()
  })

  it("renderiza detalhes do tutor", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    )

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeTruthy()
      expect(screen.getByText("(65) 98765-4321")).toBeTruthy()
      expect(screen.getByText(/Rua das Flores, 123/i)).toBeTruthy()
    })
  })

  it("renderiza imagem do tutor quando existe", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    )

    renderWithRouter()

    await waitFor(() => {
      const img = screen.getByAltText("João Silva")
      expect(img.getAttribute("src")).toBe("https://example.com/joao.jpg")
    })
  })

  it("renderiza lista de pets vinculados", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    );
    (tutoresFacade.linkedPets$ as BehaviorSubject<LinkedPet[]>).next(
      mockLinkedPets,
    )

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Rex")).toBeTruthy()
      expect(screen.getByText(/Labrador/i)).toBeTruthy()
    })
  })

  it("renderiza botão de editar", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    )

    renderWithRouter()

    await waitFor(() => {
      const editLink = screen.getByRole("link", { name: "Editar tutor" })
      expect(editLink.getAttribute("href")).toContain("/tutores/1/editar")
    })
  })

  it("renderiza link para vincular pet", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    );
    (tutoresFacade.linkedPets$ as BehaviorSubject<LinkedPet[]>).next(
      mockLinkedPets,
    )

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("+ Adicionar")).toBeTruthy()
    })
  })

  it("navega para página de vinculação ao clicar em adicionar", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    );
    (tutoresFacade.linkedPets$ as BehaviorSubject<LinkedPet[]>).next(
      mockLinkedPets,
    )

    renderWithRouter()

    await waitFor(() => {
      const addLink = screen.getByText("+ Adicionar")
      expect(addLink.closest("a")?.getAttribute("href")).toBe(
        "/tutores/1/vincular",
      )
    })
  })

  it("renderiza botão de vincular pet quando não tem pets", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    );
    (tutoresFacade.linkedPets$ as BehaviorSubject<LinkedPet[]>).next([])

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Vincular Pet")).toBeTruthy()
    })
  })

  it("chama clearSelectedTutor ao desmontar", () => {
    const { unmount } = renderWithRouter()

    unmount()

    expect(tutoresFacade.clearSelectedTutor).toHaveBeenCalled()
  })

  it("abre modal ao clicar em desvincular pet", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    );
    (tutoresFacade.linkedPets$ as BehaviorSubject<LinkedPet[]>).next(
      mockLinkedPets,
    )

    renderWithRouter()

    await waitFor(() => {
      const buttons = screen.getAllByRole("button")
      const unlinkButton = buttons.find((btn) =>
        btn.className.includes("bg-white hover:bg-red-50"),
      )
      if (unlinkButton) fireEvent.click(unlinkButton)
    })

    await waitFor(() => {
      expect(screen.getByText("Desvincular Pet")).toBeTruthy()
    })
  })

  it("chama unlinkPet ao confirmar desvinculação", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    );
    (tutoresFacade.linkedPets$ as BehaviorSubject<LinkedPet[]>).next(
      mockLinkedPets,
    )

    renderWithRouter()

    await waitFor(() => {
      const unlinkButtons = screen.getAllByRole("button")
      const unlinkButton = unlinkButtons.find((btn) =>
        btn.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]'),
      )
      if (unlinkButton) fireEvent.click(unlinkButton)
    })

    await waitFor(() => {
      const confirmButton = screen.getByText("Desvincular")
      fireEvent.click(confirmButton)
    })

    await waitFor(() => {
      expect(tutoresFacade.unlinkPet).toHaveBeenCalledWith(1, 1)
    })
  })

  it("aguarda autenticação antes de buscar tutor", () => {
    (authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(false)

    renderWithRouter()

    expect(tutoresFacade.getTutorById).not.toHaveBeenCalled()
  })

  it("renderiza mensagem quando tutor não tem pets vinculados", async () => {
    (tutoresFacade.selectedTutor$ as BehaviorSubject<Tutor | null>).next(
      mockTutor,
    );
    (tutoresFacade.linkedPets$ as BehaviorSubject<LinkedPet[]>).next([])

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText(/ainda não adotou nenhum pet/i)).toBeTruthy()
    })
  })
})
