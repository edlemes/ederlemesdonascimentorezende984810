import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { Spinner } from "../app/shared/components/Spinner"

describe("Spinner", () => {
  it("renderiza spinner azul por padrão", () => {
    const { container } = render(<Spinner />)
    const spinner = container.querySelector(".border-blue-200")
    expect(spinner).toBeTruthy()
  })

  it("renderiza spinner laranja quando variant=orange", () => {
    const { container } = render(<Spinner variant="orange" />)
    const spinner = container.querySelector(".border-orange-200")
    expect(spinner).toBeTruthy()
  })

  it("renderiza em tela cheia por padrão", () => {
    const { container } = render(<Spinner />)
    const wrapper = container.querySelector(".min-h-screen")
    expect(wrapper).toBeTruthy()
  })

  it("renderiza sem tela cheia quando fullScreen=false", () => {
    const { container } = render(<Spinner fullScreen={false} />)
    const wrapper = container.querySelector(".h-64")
    expect(wrapper).toBeTruthy()
  })

  it("renderiza tamanho médio por padrão", () => {
    const { container } = render(<Spinner />)
    const spinner = container.querySelector(".h-12")
    expect(spinner).toBeTruthy()
  })

  it("renderiza tamanho pequeno quando size=sm", () => {
    const { container } = render(<Spinner size="sm" />)
    const spinner = container.querySelector(".h-8")
    expect(spinner).toBeTruthy()
  })

  it("renderiza tamanho grande quando size=lg", () => {
    const { container } = render(<Spinner size="lg" />)
    const spinner = container.querySelector(".h-16")
    expect(spinner).toBeTruthy()
  })

  it("aplica background bg-gray-100", () => {
    const { container } = render(<Spinner />)
    const wrapper = container.querySelector(".bg-gray-100")
    expect(wrapper).toBeTruthy()
  })
})
