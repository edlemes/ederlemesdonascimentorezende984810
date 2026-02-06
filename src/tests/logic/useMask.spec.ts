import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMask } from '../../app/shared/hooks/useMask'

describe('useMask', () => {
  describe('phone', () => {
    it('formata telefone com DDD e 9 dígitos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.phone('11987654321')).toBe('(11) 98765-4321')
    })

    it('formata telefone com DDD e 8 dígitos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.phone('1133334444')).toBe('(11) 3333-4444')
    })

    it('formata parcialmente quando está digitando', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.phone('11')).toBe('(11')
      expect(result.current.phone('119')).toBe('(11) 9')
      expect(result.current.phone('11987')).toBe('(11) 987')
      expect(result.current.phone('119876')).toBe('(11) 9876')
      expect(result.current.phone('1198765')).toBe('(11) 9876-5')
    })

    it('limita em 11 dígitos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.phone('119876543219999')).toBe('(11) 98765-4321')
    })

    it('remove caracteres não numéricos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.phone('(11) 98765-4321')).toBe('(11) 98765-4321')
      expect(result.current.phone('11 98765 4321')).toBe('(11) 98765-4321')
    })

    it('retorna string vazia para input vazio', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.phone('')).toBe('')
    })
  })

  describe('cpf', () => {
    it('formata CPF completo', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.cpf('12345678901')).toBe('123.456.789-01')
    })

    it('formata parcialmente quando está digitando', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.cpf('123')).toBe('123')
      expect(result.current.cpf('1234')).toBe('123.4')
      expect(result.current.cpf('1234567')).toBe('123.456.7')
      expect(result.current.cpf('123456789')).toBe('123.456.789')
      expect(result.current.cpf('1234567890')).toBe('123.456.789-0')
    })

    it('limita em 11 dígitos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.cpf('123456789019999')).toBe('123.456.789-01')
    })

    it('remove caracteres não numéricos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.cpf('123.456.789-01')).toBe('123.456.789-01')
      expect(result.current.cpf('123 456 789 01')).toBe('123.456.789-01')
    })

    it('retorna string vazia para input vazio', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.cpf('')).toBe('')
    })
  })

  describe('currency', () => {
    it('formata valor em reais', () => {
      const { result } = renderHook(() => useMask())
      const formatted = result.current.currency('12345')
      expect(formatted).toMatch(/R\$\s123,45/)
      expect(formatted).toContain('123,45')
    })

    it('formata valores pequenos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.currency('1')).toMatch(/R\$\s0,01/)
      expect(result.current.currency('10')).toMatch(/R\$\s0,10/)
      expect(result.current.currency('100')).toMatch(/R\$\s1,00/)
    })

    it('formata valores grandes', () => {
      const { result } = renderHook(() => useMask())
      const formatted = result.current.currency('123456789')
      expect(formatted).toMatch(/R\$\s1\.234\.567,89/)
      expect(formatted).toContain('1.234.567,89')
    })

    it('remove caracteres não numéricos', () => {
      const { result } = renderHook(() => useMask())
      const formatted = result.current.currency('R$ 123,45')
      expect(formatted).toMatch(/R\$\s123,45/)
      expect(formatted).toContain('123,45')
    })

    it('retorna string vazia para input vazio', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.currency('')).toBe('')
    })
  })

  describe('onlyNumbers', () => {
    it('retorna apenas dígitos numéricos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.onlyNumbers('abc123def456')).toBe('123456')
    })

    it('remove todos os caracteres não numéricos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.onlyNumbers('!@#$123%^&*456')).toBe('123456')
    })

    it('retorna string vazia para string sem números', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.onlyNumbers('abcdef')).toBe('')
    })

    it('retorna string vazia para input vazio', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.onlyNumbers('')).toBe('')
    })

    it('mantém números intactos', () => {
      const { result } = renderHook(() => useMask())
      expect(result.current.onlyNumbers('123456')).toBe('123456')
    })
  })
})
