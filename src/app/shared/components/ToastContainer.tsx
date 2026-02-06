import { useEffect, useState } from "react"
import { toastStore, type Toast as ToastType } from "../toast/toast.store"
import { Toast } from "./Toast"

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastType[]>([])

  useEffect(() => {
    const sub = toastStore.toasts$.subscribe(setToasts)
    return () => sub.unsubscribe()
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-9999 flex flex-col gap-3"
      aria-live="polite"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={toastStore.dismiss.bind(toastStore)}
        />
      ))}
    </div>
  )
}
