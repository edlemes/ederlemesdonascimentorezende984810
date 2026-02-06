import { useEffect, useRef } from "react"

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  variant?: "danger" | "warning" | "success"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isLoading = false,
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, isLoading, onCancel])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel()
    }
  }

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      iconBg: "bg-gradient-to-br from-red-50 to-red-100",
      iconColor: "text-red-600",
      iconRing: "ring-red-200/50",
      buttonBg: "bg-gradient-to-r from-red-600 to-red-700",
      buttonHover: "hover:from-red-700 hover:to-red-800",
      buttonShadow:
        "shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40",
      focusRing: "focus:ring-red-500/50",
      gradientBar: "from-red-500 via-red-600 to-red-700",
    },
    warning: {
      iconBg: "bg-gradient-to-br from-amber-50 to-amber-100",
      iconColor: "text-amber-600",
      iconRing: "ring-amber-200/50",
      buttonBg: "bg-gradient-to-r from-amber-600 to-orange-600",
      buttonHover: "hover:from-amber-700 hover:to-orange-700",
      buttonShadow:
        "shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40",
      focusRing: "focus:ring-amber-500/50",
      gradientBar: "from-amber-500 via-orange-500 to-amber-600",
    },
    success: {
      iconBg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconColor: "text-emerald-600",
      iconRing: "ring-emerald-200/50",
      buttonBg: "bg-gradient-to-r from-emerald-600 to-green-600",
      buttonHover: "hover:from-emerald-700 hover:to-green-700",
      buttonShadow:
        "shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40",
      focusRing: "focus:ring-emerald-500/50",
      gradientBar: "from-emerald-500 via-green-500 to-emerald-600",
    },
  }

  const styles = variantStyles[variant]

  const iconPath = {
    danger:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    warning:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        <div className={`h-1.5 bg-gradient-to-r ${styles.gradientBar}`} />

        <div className="p-8">
          <div className="flex items-start gap-5">
            <div
              className={`relative flex-shrink-0 w-16 h-16 ${styles.iconBg} rounded-2xl flex items-center justify-center ring-4 ${styles.iconRing} shadow-lg`}
            >
              <svg
                className={`w-8 h-8 ${styles.iconColor}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={iconPath[variant]}
                />
              </svg>
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse" />
            </div>

            <div className="flex-1 pt-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                {title}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-8 pb-8">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-gray-300/50 active:scale-[0.97] shadow-sm hover:shadow-md overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <span className="relative">{cancelLabel}</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 relative inline-flex items-center justify-center gap-2.5 ${styles.buttonBg} ${styles.buttonHover} text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 ${styles.focusRing} active:scale-[0.97] ${styles.buttonShadow} overflow-hidden group`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 relative z-10"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            <span className="relative z-10">{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
