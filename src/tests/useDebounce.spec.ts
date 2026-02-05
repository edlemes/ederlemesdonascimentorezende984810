import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useDebounce } from '../app/shared/hooks/useDebounce'

describe('useDebounce', () => {
  it('retorna valor inicial e atualiza após o delay', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 200 } },
    )

    expect(result.current).toBe('a')

    rerender({ value: 'b', delay: 200 })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(199)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')

    vi.useRealTimers()
  })

  it('aplica o último valor quando rerender ocorre antes do delay', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 1 } },
    )

    rerender({ value: 2 })
    rerender({ value: 3 })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe(3)

    vi.useRealTimers()
  })
})
