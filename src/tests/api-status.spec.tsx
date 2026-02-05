import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'

import { ApiStatus } from '../app/shared/components/ApiStatus'

describe('ApiStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('exibe online quando fetch retorna ok=true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

    render(<ApiStatus />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByLabelText('API Online')).toBeTruthy()
  })

  it('exibe offline quando fetch falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))

    render(<ApiStatus />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByLabelText('API Offline')).toBeTruthy()
  })
})
