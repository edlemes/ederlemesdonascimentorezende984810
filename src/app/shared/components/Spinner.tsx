type SpinnerVariant = "orange" | "blue"

interface SpinnerProps {
  variant?: SpinnerVariant
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
}

export const Spinner = ({
  variant = "blue",
  size = "md",
  fullScreen = true,
}: SpinnerProps) => {
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-4",
    lg: "h-16 w-16 border-4",
  }

  const colorClasses = {
    orange: {
      border: "border-orange-200",
      borderTop: "border-t-orange-600",
    },
    blue: {
      border: "border-blue-200",
      borderTop: "border-t-blue-600",
    },
  }

  const containerClasses = fullScreen
    ? "min-h-screen bg-gray-100 flex justify-center items-center"
    : "flex justify-center items-center h-64"

  return (
    <div className={containerClasses} role="status" aria-label="Carregando">
      <div className="relative">
        <div
          className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[variant].border}`}
        />
        <div
          className={`absolute top-0 left-0 animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[variant].border} ${colorClasses[variant].borderTop}`}
        />
      </div>
    </div>
  )
}
