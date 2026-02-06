import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { BehaviorSubject } from "rxjs"

import MainLayout from "../../app/shared/layouts/MainLayout"
import { petsFacade } from "../../app/features/pets/facades/pets.facade"
import { tutoresFacade } from "../../app/features/tutores/facades/tutores.facade"

vi.mock("../../app/features/pets/facades/pets.facade", () => ({
  petsFacade: {
    error$: new BehaviorSubject<string | null>(null),
    clearError: vi.fn(),
  },
}))

vi.mock("../../app/features/tutores/facades/tutores.facade", () => ({
  tutoresFacade: {
    error$: new BehaviorSubject<string | null>(null),
    clearError: vi.fn(),
  },
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe("MainLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (petsFacade.error$ as BehaviorSubject<string | null>).next(null);
    (tutoresFacade.error$ as BehaviorSubject<string | null>).next(null)
  })

  it("renderiza Navbar", () => {
    renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    )

    expect(screen.getByText("Pata Digital")).toBeTruthy()
  })

  it("renderiza Footer", () => {
    renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    )

    expect(
      screen.getByText("SEPLAG - Governo do Estado de Mato Grosso"),
    ).toBeTruthy()
  })

  it("renderiza children no main", () => {
    renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    )

    expect(screen.getByText("Test Content")).toBeTruthy()
  })

  it("renderiza ToastContainer", async () => {
    renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    (petsFacade.error$ as BehaviorSubject<string | null>).next(
      "Testando ToastContainer",
    )

    await waitFor(() => {
      const toastContainer = document.querySelector('[aria-live="polite"]')
      expect(toastContainer).toBeTruthy()
    })
  })

  it("aplica min-h-screen no container", () => {
    const { container } = renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    )

    const mainContainer = container.querySelector(".min-h-screen")
    expect(mainContainer).toBeTruthy()
  })

  it("aplica background cinza", () => {
    const { container } = renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    )

    const mainContainer = container.querySelector(".bg-gray-100")
    expect(mainContainer).toBeTruthy()
  })

  it("usa flex-col para layout vertical", () => {
    const { container } = renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    )

    const mainContainer = container.querySelector(".flex.flex-col")
    expect(mainContainer).toBeTruthy()
  })

  it("main tem flex-1 para ocupar espaço disponível", () => {
    const { container } = renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    )

    const main = container.querySelector("main")
    expect(main?.className).toContain("flex-1")
  })

  it("chama clearError quando petsFacade emite erro", async () => {
    renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );
    (petsFacade.error$ as BehaviorSubject<string | null>).next("Erro no pets")

    await waitFor(() => {
      expect(petsFacade.clearError).toHaveBeenCalled()
    })
  })

  it("chama clearError quando tutoresFacade emite erro", async () => {
    renderWithRouter(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );
    (tutoresFacade.error$ as BehaviorSubject<string | null>).next(
      "Erro no tutores",
    )

    await waitFor(() => {
      expect(tutoresFacade.clearError).toHaveBeenCalled()
    })
  })
})
