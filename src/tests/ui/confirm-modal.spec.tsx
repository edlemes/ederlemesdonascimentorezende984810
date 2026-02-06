import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { ConfirmModal } from '../../app/shared/components/ConfirmModal'

describe('ConfirmModal', () => {
  it('não renderiza quando isOpen=false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        title="T"
        message="M"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.queryByText('T')).toBeNull()
  })

  it('chama onCancel ao clicar no backdrop (quando não está loading)', () => {
    const onCancel = vi.fn()

    const { container } = render(
      <ConfirmModal
        isOpen
        title="T"
        message="M"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )

    const backdrop = container.firstElementChild as HTMLElement
    fireEvent.click(backdrop)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('não chama onCancel no backdrop quando isLoading=true', () => {
    const onCancel = vi.fn()

    const { container } = render(
      <ConfirmModal
        isOpen
        title="T"
        message="M"
        isLoading
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )

    const backdrop = container.firstElementChild as HTMLElement
    fireEvent.click(backdrop)

    expect(onCancel).not.toHaveBeenCalled()
  })

  it('chama onCancel ao pressionar Escape (quando não está loading)', () => {
    const onCancel = vi.fn()

    render(
      <ConfirmModal
        isOpen
        title="T"
        message="M"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
