import { useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toastStore } from "../toast/toast.store"

interface UseValidatedIdOptions {
  paramName?: string
  fallbackRoute: string
  showToast?: boolean
}

interface UseValidatedIdResult {
  id: number | null
  isValid: boolean
}

export function useValidatedId(
  options: UseValidatedIdOptions,
): UseValidatedIdResult {
  const { paramName = "id", fallbackRoute, showToast = true } = options
  const params = useParams<Record<string, string>>()
  const navigate = useNavigate()
  const rawId = params[paramName]

  const validationResult = useMemo(() => {
    if (!rawId) {
      return { id: null, isValid: false }
    }

    const trimmedId = rawId.trim()

    if (!/^\d+$/.test(trimmedId)) {
      return { id: null, isValid: false }
    }

    const numericId = parseInt(trimmedId, 10)

    if (isNaN(numericId) || numericId <= 0 || !Number.isFinite(numericId)) {
      return { id: null, isValid: false }
    }

    return { id: numericId, isValid: true }
  }, [rawId])

  useEffect(() => {
    if (rawId && !validationResult.isValid) {
      if (showToast) {
        toastStore.error(
          "ID inválido",
          "O identificador informado na URL é inválido.",
        )
      }
      navigate(fallbackRoute, { replace: true })
    }
  }, [rawId, validationResult.isValid, fallbackRoute, navigate, showToast])

  return validationResult
}
