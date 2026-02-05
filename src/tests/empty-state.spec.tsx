import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { EmptyState } from '../app/shared/components/EmptyState'

describe('EmptyState', () => {
  it('renderiza título e descrição quando informado', () => {
    render(<EmptyState title="Nada aqui" description="Tente novamente" />)

    expect(screen.getByText('Nada aqui')).toBeTruthy()
    expect(screen.getByText('Tente novamente')).toBeTruthy()
  })

  it('não renderiza botão quando actionLabel/onAction não existem', () => {
    render(<EmptyState title="Nada" />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renderiza botão e dispara onAction', () => {
    const onAction = vi.fn()

    render(
      <EmptyState
        title="Nada"
        actionLabel="Recarregar"
        onAction={onAction}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Recarregar' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
