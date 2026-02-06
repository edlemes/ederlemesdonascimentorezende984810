import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { Pagination } from '../../app/features/pets/components/Pagination'

describe('Pagination', () => {
  it('renderiza botões de navegação', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Anterior')).toBeTruthy()
    expect(screen.getByText('Próximo')).toBeTruthy()
  })

  it('renderiza todos os números de página quando totalPages <= 5', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('desabilita botão Anterior na primeira página', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    )

    const prevButton = screen.getByText('Anterior').closest('button')
    expect(prevButton?.disabled).toBe(true)
  })

  it('desabilita botão Próximo na última página', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    )

    const nextButton = screen.getByText('Próximo').closest('button')
    expect(nextButton?.disabled).toBe(true)
  })

  it('chama onPageChange ao clicar em número de página', () => {
    const onPageChange = vi.fn()

    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
      />,
    )

    fireEvent.click(screen.getByText('3'))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('chama onPageChange ao clicar em Anterior', () => {
    const onPageChange = vi.fn()

    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={onPageChange}
      />,
    )

    fireEvent.click(screen.getByText('Anterior'))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('chama onPageChange ao clicar em Próximo', () => {
    const onPageChange = vi.fn()

    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
      />,
    )

    fireEvent.click(screen.getByText('Próximo'))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('destaca página atual com cor laranja por padrão', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    )

    const currentPageButton = screen.getByText('2').closest('button')
    expect(currentPageButton?.className).toContain('bg-orange-600')
  })

  it('destaca página atual com cor azul quando variant=blue', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={vi.fn()}
        variant="blue"
      />,
    )

    const currentPageButton = screen.getByText('2').closest('button')
    expect(currentPageButton?.className).toContain('bg-blue-600')
  })

  it('renderiza máximo de 5 páginas quando totalPages > 5', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={vi.fn()}
      />,
    )

    const pageButtons = screen.getAllByRole('button').filter(
      (btn) => !btn.textContent?.includes('Anterior') && !btn.textContent?.includes('Próximo')
    )

    expect(pageButtons.length).toBeGreaterThanOrEqual(5)
    expect(pageButtons.length).toBeLessThanOrEqual(6)
  })

  it('centraliza páginas ao redor da página atual', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('6')).toBeTruthy()
    expect(screen.getByText('7')).toBeTruthy()
  })
})
