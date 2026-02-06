import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { ImageUpload } from '../../app/shared/components/ImageUpload'

describe('ImageUpload', () => {
  it('chama onFileSelect ao selecionar imagem válida', () => {
    const onFileSelect = vi.fn()

    const readAsDataURL = vi.fn(function (this: any) {
      this.result = 'data:image/png;base64,xxx'
      this.onloadend?.()
    });

    (globalThis as any).FileReader = vi.fn(() => ({
      readAsDataURL,
      onloadend: null,
      result: null,
    }))

    render(<ImageUpload onFileSelect={onFileSelect} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['a'], 'a.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it('não chama onFileSelect ao selecionar arquivo não-imagem', () => {
    const onFileSelect = vi.fn()

    render(<ImageUpload onFileSelect={onFileSelect} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['a'], 'a.txt', { type: 'text/plain' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelect).not.toHaveBeenCalled()
  })

  it('renderiza preview quando currentImageUrl existe', () => {
    render(<ImageUpload onFileSelect={vi.fn()} currentImageUrl="http://img" />)

    expect(screen.getByAltText('Preview')).toBeTruthy()
  })
})
