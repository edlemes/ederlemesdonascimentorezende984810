import { useCallback } from "react"

export interface MaskFunctions {
  phone: (value: string) => string
  cpf: (value: string) => string
  currency: (value: string) => string
  onlyNumbers: (value: string) => string
}

export function useMask(): MaskFunctions {
  const phone = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    
    if (digits.length === 0) return ""
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }, [])

  const cpf = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    
    if (digits.length === 0) return ""
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }, [])

  const currency = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, "")
    
    if (digits.length === 0) return ""
    
    const number = parseInt(digits, 10) / 100
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(number)
  }, [])

  const onlyNumbers = useCallback((value: string): string => {
    return value.replace(/\D/g, "")
  }, [])

  return { phone, cpf, currency, onlyNumbers }
}
