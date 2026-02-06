import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import * as ReactRouterDom from "react-router-dom"
import { useValidatedId } from "../../app/shared/hooks/useValidatedId"
import { toastStore } from "../../app/shared/toast/toast.store"

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof ReactRouterDom>("react-router-dom")
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  }
})

vi.mock("../../app/shared/toast/toast.store", () => ({
  toastStore: {
    error: vi.fn(),
  },
}))

describe("useValidatedId", () => {
  const mockNavigate = vi.fn()
  const mockUseParams = ReactRouterDom.useParams as ReturnType<typeof vi.fn>
  const mockUseNavigate = ReactRouterDom.useNavigate as ReturnType<
    typeof vi.fn
  >
  const mockToastError = toastStore.error as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseNavigate.mockReturnValue(mockNavigate)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("retorna id válido quando parâmetro é número positivo", () => {
    mockUseParams.mockReturnValue({ id: "123" })

    const { result } = renderHook(() => useValidatedId({ fallbackRoute: "/" }))

    expect(result.current.id).toBe(123)
    expect(result.current.isValid).toBe(true)
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("retorna inválido e redireciona quando id contém texto", async () => {
    mockUseParams.mockReturnValue({ id: "abc" })

    const { result } = renderHook(() =>
      useValidatedId({ fallbackRoute: "/pets" }),
    )

    expect(result.current.id).toBeNull()
    expect(result.current.isValid).toBe(false)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/pets", { replace: true })
    })
    expect(mockToastError).toHaveBeenCalledWith(
      "ID inválido",
      "O identificador informado na URL é inválido.",
    )
  })

  it("retorna inválido quando id é número negativo", async () => {
    mockUseParams.mockReturnValue({ id: "-5" })

    const { result } = renderHook(() =>
      useValidatedId({ fallbackRoute: "/tutores" }),
    )

    expect(result.current.id).toBeNull()
    expect(result.current.isValid).toBe(false)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/tutores", { replace: true })
    })
  })

  it("retorna inválido quando id é zero", async () => {
    mockUseParams.mockReturnValue({ id: "0" })

    const { result } = renderHook(() => useValidatedId({ fallbackRoute: "/" }))

    expect(result.current.id).toBeNull()
    expect(result.current.isValid).toBe(false)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
    })
  })

  it("retorna inválido quando id possui espaços mas é numérico", () => {
    mockUseParams.mockReturnValue({ id: "  42  " })

    const { result } = renderHook(() => useValidatedId({ fallbackRoute: "/" }))

    expect(result.current.id).toBe(42)
    expect(result.current.isValid).toBe(true)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("retorna inválido quando id é string vazia", () => {
    mockUseParams.mockReturnValue({ id: "" })

    const { result } = renderHook(() => useValidatedId({ fallbackRoute: "/" }))

    expect(result.current.id).toBeNull()
    expect(result.current.isValid).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("retorna inválido quando id é undefined", () => {
    mockUseParams.mockReturnValue({})

    const { result } = renderHook(() => useValidatedId({ fallbackRoute: "/" }))

    expect(result.current.id).toBeNull()
    expect(result.current.isValid).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("usa paramName personalizado quando fornecido", () => {
    mockUseParams.mockReturnValue({ petId: "99" })

    const { result } = renderHook(() =>
      useValidatedId({ paramName: "petId", fallbackRoute: "/" }),
    )

    expect(result.current.id).toBe(99)
    expect(result.current.isValid).toBe(true)
  })

  it("não exibe toast quando showToast é false", async () => {
    mockUseParams.mockReturnValue({ id: "invalid" })

    renderHook(() => useValidatedId({ fallbackRoute: "/", showToast: false }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
    })
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("retorna inválido quando id contém caracteres especiais", async () => {
    mockUseParams.mockReturnValue({ id: "12@34" })

    const { result } = renderHook(() => useValidatedId({ fallbackRoute: "/" }))

    expect(result.current.id).toBeNull()
    expect(result.current.isValid).toBe(false)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  it("retorna inválido quando id contém número decimal", async () => {
    mockUseParams.mockReturnValue({ id: "12.5" })

    const { result } = renderHook(() => useValidatedId({ fallbackRoute: "/" }))

    expect(result.current.id).toBeNull()
    expect(result.current.isValid).toBe(false)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  it("retorna válido para números grandes", () => {
    mockUseParams.mockReturnValue({ id: "999999999" })

    const { result } = renderHook(() => useValidatedId({ fallbackRoute: "/" }))

    expect(result.current.id).toBe(999999999)
    expect(result.current.isValid).toBe(true)
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
