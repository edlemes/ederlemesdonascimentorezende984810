import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { Footer } from "../../app/core/layouts/Footer"

describe("Footer", () => {
  it("renderiza copyright com ano atual", () => {
    const currentYear = new Date().getFullYear()
    render(<Footer />)

    expect(screen.getByText(`© ${currentYear} Éder Lemes`)).toBeTruthy()
  })

  it("renderiza texto do Governo do Estado", () => {
    render(<Footer />)

    expect(
      screen.getByText("SEPLAG - Governo do Estado de Mato Grosso"),
    ).toBeTruthy()
  })

  it("aplica borda superior", () => {
    const { container } = render(<Footer />)

    const footer = container.querySelector("footer")
    expect(footer?.className).toContain("border-t")
  })

  it("aplica background branco", () => {
    const { container } = render(<Footer />)

    const footer = container.querySelector("footer")
    expect(footer?.className).toContain("bg-white")
  })

  it("renderiza layout flex para dispositivos maiores", () => {
    const { container } = render(<Footer />)

    const flexContainer = container.querySelector(
      ".flex.flex-col.sm\\:flex-row",
    )
    expect(flexContainer).toBeTruthy()
  })

  it("centraliza conteúdo com container", () => {
    const { container } = render(<Footer />)

    const containerDiv = container.querySelector(".max-w-7xl.mx-auto")
    expect(containerDiv).toBeTruthy()
  })
})
