import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { authFacade as defaultAuthFacade } from "../../features/auth/facades/auth.facade"
import type { AuthFacade } from "../../features/auth/facades/auth.facade"

interface ProtectedRouteProps {
  children: React.ReactNode;
  authFacade?: AuthFacade;
}

type AuthState = "loading" | "authenticated" | "unauthenticated";

export function ProtectedRoute({
  children,
  authFacade = defaultAuthFacade,
}: ProtectedRouteProps) {
  const [authState, setAuthState] = useState<AuthState>("loading")

  useEffect(() => {
    let isLoadingValue = true
    let isAuthenticatedValue = false

    const updateState = () => {
      if (isLoadingValue) {
        setAuthState("loading")
      } else if (isAuthenticatedValue) {
        setAuthState("authenticated")
      } else {
        setAuthState("unauthenticated")
      }
    }

    const loadingSub = authFacade.isLoading$.subscribe((loading) => {
      isLoadingValue = loading
      updateState()
    })

    const authSub = authFacade.isAuthenticated$.subscribe((authenticated) => {
      isAuthenticatedValue = authenticated
      updateState()
    })

    authFacade.autoLogin()

    return () => {
      loadingSub.unsubscribe()
      authSub.unsubscribe()
    }
  }, [authFacade])

  if (authState === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
