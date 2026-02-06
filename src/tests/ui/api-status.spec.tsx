import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

import { ApiStatus } from "../../app/shared/components/ApiStatus"

describe("ApiStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("inicia com status checking", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    )

    const { container } = render(<ApiStatus />)

    const checkingElement = container.querySelector(".bg-yellow-500")
    expect(checkingElement).toBeTruthy()
  })

  it("exibe online quando fetch retorna ok=true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }))

    render(<ApiStatus />)

    await waitFor(() => {
      expect(screen.getByLabelText("API Online")).toBeTruthy()
    })
  })

  it("muda para offline quando API responde com erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    )

    render(<ApiStatus />)

    await waitFor(() => {
      expect(screen.getByLabelText("API Offline")).toBeTruthy()
    })
  })

  it("exibe offline quando fetch falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")))

    render(<ApiStatus />)

    await waitFor(() => {
      expect(screen.getByLabelText("API Offline")).toBeTruthy()
    })
  })

  it("aplica animação pulse quando status é online", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }))

    const { container } = render(<ApiStatus />)

    await waitFor(() => {
      const pulseElement = container.querySelector(
        ".bg-green-500.animate-pulse",
      )
      expect(pulseElement).toBeTruthy()
    })
  })

  it("não aplica animação pulse quando status é offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))

    const { container } = render(<ApiStatus />)

    await waitFor(() => {
      const offlineElement = container.querySelector(".bg-red-500")
      expect(offlineElement).toBeTruthy()
    })

    const pulseElement = container.querySelector(".bg-red-500.animate-pulse")
    expect(pulseElement).toBeNull()
  })
})
