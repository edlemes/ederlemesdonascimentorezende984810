import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { BehaviorSubject } from "rxjs"

import { LinkPetPage } from "../../app/features/tutores/pages/LinkPetPage"
import { petsFacade } from "../../app/features/pets/facades/pets.facade"
import { tutoresFacade } from "../../app/features/tutores/facades/tutores.facade"
import { authFacade } from "../../app/features/auth/facades/auth.facade"
import type { Pet } from "../../app/features/pets/models/pet.model"

const mockPets: Pet[] = [
  {
    id: 1,
    nome: "Rex",
    especie: "Cachorro",
    raca: "Labrador",
    idade: 3,
    fotoUrl: "https://example.com/rex.jpg",
  },
  {
    id: 2,
    nome: "Miau",
    especie: "Gato",
    raca: "Siamês",
    idade: 2,
  },
]

vi.mock("../../app/features/pets/facades/pets.facade", () => ({
  petsFacade: {
    pets$: new BehaviorSubject<Pet[]>([]),
    isLoading$: new BehaviorSubject<boolean>(false),
    pagination$: new BehaviorSubject({ page: 1, totalPages: 1 }),
    getAllPets: vi.fn(),
  },
}))

vi.mock("../../app/features/tutores/facades/tutores.facade", () => ({
  tutoresFacade: {
    linkPet: vi.fn().mockResolvedValue(undefined),
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
        <Route path="/tutores/:id/link-pet" element={<LinkPetPage />} />
      </Routes>
    </BrowserRouter>,
    {
      wrapper: ({ children }) => {
        window.history.pushState({}, "", `/tutores/${tutorId}/link-pet`)
        return <>{children}</>
      },
    },
  )
}

describe("LinkPetPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next([]);
    (petsFacade.isLoading$ as BehaviorSubject<boolean>).next(false);
    (petsFacade.pagination$ as BehaviorSubject<any>).next({
      page: 1,
      totalPages: 1,
    });
    (authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(true)
  })

  it("renderiza título da página", () => {
    renderWithRouter()

    expect(screen.getByText("Vincular Pet")).toBeTruthy()
  })

  it("renderiza campo de busca", () => {
    renderWithRouter()

    expect(screen.getByPlaceholderText("Buscar pet por nome...")).toBeTruthy()
  })

  it("chama getAllPets ao montar", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(petsFacade.getAllPets).toHaveBeenCalled()
    })
  })

  it("exibe skeleton quando está carregando", () => {
    (petsFacade.isLoading$ as BehaviorSubject<boolean>).next(true)

    const { container } = renderWithRouter()

    const skeleton = container.querySelector(".animate-pulse")
    expect(skeleton).toBeTruthy()
  })

  it("renderiza lista de pets quando há dados", async () => {
    renderWithRouter();
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next(mockPets)

    await waitFor(() => {
      expect(screen.getByText("Rex")).toBeTruthy()
      expect(screen.getByText("Miau")).toBeTruthy()
    })
  })

  it("renderiza botão de vincular para cada pet", async () => {
    renderWithRouter();
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next(mockPets)

    await waitFor(() => {
      const linkButtons = screen.getAllByRole("button", {
        name: /vincular pet/i,
      })
      expect(linkButtons.length).toBe(2)
    })
  })

  it("abre modal de confirmação ao clicar em vincular", async () => {
    renderWithRouter();
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next(mockPets)

    await waitFor(() => {
      expect(screen.getByText("Rex")).toBeTruthy()
    })

    const linkButton = screen.getAllByRole("button", {
      name: /vincular pet/i,
    })[0]
    fireEvent.click(linkButton)

    await waitFor(() => {
      expect(screen.getByText(/deseja vincular/i)).toBeTruthy()
    })
  })

  it("chama linkPet ao confirmar vinculação", async () => {
    renderWithRouter("1");
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next(mockPets)

    await waitFor(() => {
      expect(screen.getByText("Rex")).toBeTruthy()
    })

    const linkButton = screen.getAllByRole("button", {
      name: /vincular pet/i,
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

  it("chama getAllPets ao buscar", async () => {
    renderWithRouter()

    const searchInput = screen.getByPlaceholderText("Buscar pet por nome...")
    fireEvent.change(searchInput, { target: { value: "Rex" } })

    await waitFor(
      () => {
        expect(petsFacade.getAllPets).toHaveBeenCalledWith(1, "Rex")
      },
      { timeout: 1000 },
    )
  })

  it("renderiza paginação quando há múltiplas páginas", async () => {
    renderWithRouter();
    (petsFacade.pagination$ as BehaviorSubject<any>).next({
      page: 1,
      totalPages: 3,
    });
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next(mockPets)

    await waitFor(() => {
      expect(screen.getByText("Rex")).toBeTruthy()
    })

    const prevButton = screen.getByRole("button", { name: /anterior/i })
    expect(prevButton).toBeTruthy()
  })

  it("renderiza mensagem quando não há pets", () => {
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next([])

    renderWithRouter()

    expect(screen.getByText("Nenhum pet encontrado")).toBeTruthy()
  })

  it("renderiza botão de voltar", () => {
    renderWithRouter()

    expect(screen.getByText("Voltar ao tutor")).toBeTruthy()
  })

  it("desabilita botões durante vinculação", async () => {
    renderWithRouter();
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next(mockPets)

    await waitFor(() => {
      expect(screen.getByText("Rex")).toBeTruthy()
    })

    const linkButton = screen.getAllByRole("button", {
      name: /vincular pet/i,
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
      const buttons = screen.getAllByRole("button", { name: /vincular pet/i })
      buttons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })
  })

  it("aguarda autenticação antes de carregar pets", () => {
    (authFacade.isAuthenticated$ as BehaviorSubject<boolean>).next(false)

    renderWithRouter()

    expect(petsFacade.getAllPets).not.toHaveBeenCalled()
  })

  it("renderiza informações do pet nos cards", async () => {
    renderWithRouter();
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next(mockPets)

    await waitFor(() => {
      expect(screen.getByText("Cachorro")).toBeTruthy()
      expect(screen.getByText("Labrador")).toBeTruthy()
    })
  })

  it("exibe emoji quando pet não tem foto", async () => {
    renderWithRouter();
    (petsFacade.pets$ as BehaviorSubject<Pet[]>).next([mockPets[1]])

    await waitFor(() => {
      expect(screen.getByText("Miau")).toBeTruthy()
    })

    const emoji = document.querySelector(".text-4xl")
    expect(emoji?.textContent).toBe("🐾")
  })
})
