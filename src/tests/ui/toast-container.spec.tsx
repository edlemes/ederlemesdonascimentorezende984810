import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { ToastContainer } from "../../app/shared/components/ToastContainer"

vi.mock("../../app/shared/toast/toast.store", () => {
  return {
    toastStore: {
      toasts$: {
        subscribe: (cb: any) => {
          cb([
            {
              id: "1",
              type: "success",
              title: "Ok",
              message: "Tudo certo",
              duration: 1000,
            },
          ])
          return { unsubscribe: vi.fn() }
        },
      },
      dismiss: vi.fn(),
    },
  }
})

describe("ToastContainer", () => {
  it("renderiza toasts vindos do store", () => {
    render(<ToastContainer />)

    expect(screen.getByLabelText("Notificações")).toBeTruthy()
    expect(screen.getByText("Ok")).toBeTruthy()
    expect(screen.getByText("Tudo certo")).toBeTruthy()
  })
})
