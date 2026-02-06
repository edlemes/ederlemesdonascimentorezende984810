import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { Navbar } from '../../app/core/layouts/Navbar'

const renderWithRouter = (component: React.ReactElement, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  it('renderiza logo e nome do aplicativo', () => {
    renderWithRouter(<Navbar />)

    expect(screen.getByAltText('SEPLAG MT')).toBeTruthy()
    expect(screen.getByText('Pata Digital')).toBeTruthy()
  })

  it('renderiza link para página de Pets', () => {
    renderWithRouter(<Navbar />)

    const petsLink = screen.getByText('Pets').closest('a')
    expect(petsLink?.getAttribute('href')).toBe('/')
  })

  it('renderiza link para página de Tutores', () => {
    renderWithRouter(<Navbar />)

    const tutoresLink = screen.getByText('Tutores').closest('a')
    expect(tutoresLink?.getAttribute('href')).toBe('/tutores')
  })

  it('destaca link de Pets quando na página inicial', () => {
    renderWithRouter(<Navbar />, '/')

    const petsLink = screen.getByText('Pets').closest('a')
    expect(petsLink?.className).toContain('text-orange-600')
  })

  it('destaca link de Tutores quando na página de tutores', () => {
    renderWithRouter(<Navbar />, '/tutores')

    const tutoresLink = screen.getByText('Tutores').closest('a')
    expect(tutoresLink?.className).toContain('text-blue-600')
  })

  it('renderiza componente ApiStatus', () => {
    const { container } = renderWithRouter(<Navbar />)

    const apiStatus = container.querySelector('.bg-yellow-500, .bg-green-500, .bg-red-500')
    expect(apiStatus).toBeTruthy()
  })

  it('aplica estilo sticky no header', () => {
    const { container } = renderWithRouter(<Navbar />)

    const header = container.querySelector('header')
    expect(header?.className).toContain('sticky')
  })

  it('aplica backdrop blur no header', () => {
    const { container } = renderWithRouter(<Navbar />)

    const header = container.querySelector('header')
    expect(header?.className).toContain('backdrop-blur-xl')
  })

  it('mantém Pets ativo em rotas de pets', () => {
    renderWithRouter(<Navbar />, '/123')

    const petsLink = screen.getByText('Pets').closest('a')
    expect(petsLink?.className).toContain('text-orange-600')
  })

  it('não destaca Pets quando em rota de tutores', () => {
    renderWithRouter(<Navbar />, '/tutores/123')

    const petsLink = screen.getByText('Pets').closest('a')
    expect(petsLink?.className).not.toContain('text-orange-600')
  })
})
