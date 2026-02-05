import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { Toast } from '../app/shared/components/Toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0 as any
    })
  })

  it('renderiza título e message quando existe', () => {
    render(
      <Toast
        toast={{
          id: '1',
          type: 'success',
          title: 'Sucesso',
          message: 'Ok',
          duration: 1000,
        }}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Sucesso')).toBeTruthy()
    expect(screen.getByText('Ok')).toBeTruthy()
  })

  it('chama onDismiss após clicar em fechar (com delay de 300ms)', () => {
    const onDismiss = vi.fn()

    render(
      <Toast
        toast={{ id: '1', type: 'error', title: 'Erro', duration: 1000 }}
        onDismiss={onDismiss}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Fechar notificação' }))

    expect(onDismiss).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onDismiss).toHaveBeenCalledWith('1')
  })
})
