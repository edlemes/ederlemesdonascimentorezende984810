import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import { PetCard } from '../../app/features/pets/components/PetCard'
import type { Pet } from '../../app/features/pets/models/pet.model'

const mockPet: Pet = {
  id: 1,
  nome: 'Rex',
  especie: 'Cachorro',
  raca: 'Labrador',
  idade: 3,
  fotoUrl: 'https://example.com/rex.jpg',
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('PetCard', () => {
  it('renderiza nome do pet', () => {
    renderWithRouter(<PetCard pet={mockPet} />)

    expect(screen.getByText('Rex')).toBeTruthy()
  })

  it('renderiza espécie do pet', () => {
    renderWithRouter(<PetCard pet={mockPet} />)

    expect(screen.getByText('Cachorro')).toBeTruthy()
  })

  it('renderiza raça do pet', () => {
    renderWithRouter(<PetCard pet={mockPet} />)

    expect(screen.getByText('Labrador')).toBeTruthy()
  })

  it('renderiza idade do pet com texto no singular', () => {
    const youngPet = { ...mockPet, idade: 1 }
    renderWithRouter(<PetCard pet={youngPet} />)

    expect(screen.getByText('1 ano')).toBeTruthy()
  })

  it('renderiza idade do pet com texto no plural', () => {
    renderWithRouter(<PetCard pet={mockPet} />)

    expect(screen.getByText('3 anos')).toBeTruthy()
  })

  it('renderiza imagem do pet quando fotoUrl existe', () => {
    renderWithRouter(<PetCard pet={mockPet} />)

    const img = screen.getByAltText('Rex')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('https://example.com/rex.jpg')
  })

  it('renderiza emoji placeholder quando não há foto', () => {
    const petWithoutPhoto = { ...mockPet, fotoUrl: undefined }
    const { container } = renderWithRouter(<PetCard pet={petWithoutPhoto} />)

    const emoji = container.querySelector('span')
    expect(emoji?.textContent).toBe('🐾')
  })

  it('cria link para página de detalhes do pet', () => {
    renderWithRouter(<PetCard pet={mockPet} />)

    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/1')
  })

  it('renderiza status do pet quando disponível', () => {
    const petWithTutor = { ...mockPet, tutorId: 1, tutorNome: 'João Silva' }
    renderWithRouter(<PetCard pet={petWithTutor as Pet} />)

    expect(screen.getByText(/Já tem um lar/i)).toBeTruthy()
  })

  it('aplica classes de hover no card', () => {
    const { container } = renderWithRouter(<PetCard pet={mockPet} />)

    const article = container.querySelector('article')
    expect(article?.className).toContain('hover:shadow-xl')
    expect(article?.className).toContain('hover:-translate-y-2')
  })
})
