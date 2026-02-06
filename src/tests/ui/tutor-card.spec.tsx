import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import { TutorCard } from '../../app/features/tutores/components/TutorCard'
import type { Tutor } from '../../app/features/tutores/models/tutor.model'

const mockTutor: Tutor = {
  id: 1,
  nome: 'João Silva',
  telefone: '(65) 98765-4321',
  endereco: 'Rua das Flores, 123',
  fotoUrl: 'https://example.com/joao.jpg',
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('TutorCard', () => {
  it('renderiza nome do tutor', () => {
    renderWithRouter(<TutorCard tutor={mockTutor} />)

    expect(screen.getByText('João Silva')).toBeTruthy()
  })

  it('renderiza telefone do tutor', () => {
    renderWithRouter(<TutorCard tutor={mockTutor} />)

    expect(screen.getByText('(65) 98765-4321')).toBeTruthy()
  })

  it('renderiza "Sem telefone" quando telefone não existe', () => {
    const tutorWithoutPhone = { ...mockTutor, telefone: '' }
    renderWithRouter(<TutorCard tutor={tutorWithoutPhone} />)

    expect(screen.getByText('Sem telefone')).toBeTruthy()
  })

  it('renderiza endereço do tutor', () => {
    renderWithRouter(<TutorCard tutor={mockTutor} />)

    expect(screen.getByText(/Rua das Flores, 123/i)).toBeTruthy()
  })

  it('renderiza imagem do tutor quando fotoUrl existe', () => {
    renderWithRouter(<TutorCard tutor={mockTutor} />)

    const img = screen.getByAltText('João Silva')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('https://example.com/joao.jpg')
  })

  it('renderiza emoji placeholder quando não há foto', () => {
    const tutorWithoutPhoto = { ...mockTutor, fotoUrl: undefined }
    const { container } = renderWithRouter(<TutorCard tutor={tutorWithoutPhoto} />)

    const emoji = container.querySelector('span')
    expect(emoji?.textContent).toBe('👤')
  })

  it('cria link para página de detalhes do tutor', () => {
    renderWithRouter(<TutorCard tutor={mockTutor} />)

    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/tutores/1')
  })

  it('renderiza texto "Tutor responsável"', () => {
    renderWithRouter(<TutorCard tutor={mockTutor} />)

    expect(screen.getByText(/Tutor responsável/i)).toBeTruthy()
  })

  it('trunca telefone em 15 caracteres', () => {
    const tutorWithLongPhone = { ...mockTutor, telefone: '(65) 98765-4321 ramal 1234' }
    renderWithRouter(<TutorCard tutor={tutorWithLongPhone} />)

    const phoneText = screen.getByText(/\(65\) 98765-432/i)
    expect(phoneText.textContent?.length).toBeLessThanOrEqual(15)
  })

  it('aplica classes de hover no card', () => {
    const { container } = renderWithRouter(<TutorCard tutor={mockTutor} />)

    const article = container.querySelector('article')
    expect(article?.className).toContain('hover:shadow-xl')
    expect(article?.className).toContain('hover:-translate-y-2')
  })
})
