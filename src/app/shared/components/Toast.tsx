import { useEffect, useState, type ReactNode } from "react"
import type { Toast as ToastType, ToastType as TType } from "./toast.store"

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const iconMap: Record<TType, ReactNode> = {
  success: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
}

const styleMap: Record<TType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    border: "border-green-200",
  },
  error: {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-600",
    border: "border-red-200",
  },
  warning: {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    border: "border-amber-200",
  },
  info: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    border: "border-blue-200",
  },
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const styles = styleMap[toast.type]

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  return (
    <div
      className={`
        relative flex items-start gap-3 w-80 p-4 rounded-xl border shadow-lg backdrop-blur-sm
        ${styles.bg} ${styles.border}
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
      role="alert"
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${styles.icon}`}
      >
        {iconMap[toast.type]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
        aria-label="Fechar notificação"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div
        className={`absolute bottom-0 left-0 h-1 rounded-b-xl ${styles.icon.replace("text-", "bg-").split(" ")[0]} opacity-30`}
        style={{
          animation: `shrink ${toast.duration}ms linear forwards`,
          width: "100%",
        }}
      />

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
