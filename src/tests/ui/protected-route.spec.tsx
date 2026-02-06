import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { BehaviorSubject } from "rxjs"
import { ProtectedRoute } from "../../app/core/routing/ProtectedRoute"
import type { AuthFacade } from "../../app/features/auth/facades/auth.facade"

function createMockAuthFacade(
  isAuthenticated: boolean,
  isLoading: boolean,
): AuthFacade {
  return {
    isAuthenticated$: new BehaviorSubject(isAuthenticated),
    isLoading$: new BehaviorSubject(isLoading),
    user$: new BehaviorSubject(null),
    token$: new BehaviorSubject(null),
    login: vi.fn(),
    autoLogin: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    getToken: vi.fn().mockReturnValue(null),
  } as unknown as AuthFacade
}

describe("Componente ProtectedRoute", () => {
  it("deve renderizar spinner quando está carregando", () => {
    const mockFacade = createMockAuthFacade(false, true)

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute authFacade={mockFacade}>
          <h1>Conteúdo Secreto</h1>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.queryByText("Conteúdo Secreto")).not.toBeInTheDocument()
    expect(container.querySelector(".animate-spin")).toBeInTheDocument()
  })

  it("deve redirecionar para login quando não autenticado", () => {
    const mockFacade = createMockAuthFacade(false, false)

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<h1>Tela de Login</h1>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute authFacade={mockFacade}>
                <h1>Conteúdo Secreto</h1>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Tela de Login")).toBeInTheDocument()
    expect(screen.queryByText("Conteúdo Secreto")).not.toBeInTheDocument()
  })

  it("deve renderizar children quando autenticado", () => {
    const mockFacade = createMockAuthFacade(true, false)

    render(
      <MemoryRouter>
        <ProtectedRoute authFacade={mockFacade}>
          <h1>Conteúdo Secreto</h1>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText("Conteúdo Secreto")).toBeInTheDocument()
  })

  it("deve chamar autoLogin ao montar", () => {
    const mockFacade = createMockAuthFacade(true, false)

    render(
      <MemoryRouter>
        <ProtectedRoute authFacade={mockFacade}>
          <h1>Conteúdo</h1>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(mockFacade.autoLogin).toHaveBeenCalled()
  })
})
