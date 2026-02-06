interface EmptyStateProps {
  icon?: "search" | "pet" | "person" | "error"
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

const icons = {
  search: (
    <svg
      className="w-16 h-16 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  pet: (
    <svg
      className="w-16 h-16 text-gray-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 19c-4 0-7-2-7-5 0-2 1.5-3.5 3-4.5.5-3 2-4.5 4-4.5s3.5 1.5 4 4.5c1.5 1 3 2.5 3 4.5 0 3-3 5-7 5z"
      />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10 15c.5.5 1.5 1 2 1s1.5-.5 2-1"
      />
    </svg>
  ),
  person: (
    <svg
      className="w-16 h-16 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-16 h-16 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
}

export function EmptyState({
  icon = "search",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        {icons[icon]}
      </div>

      <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
        {title}
      </h3>

      {description && (
        <p className="text-gray-500 text-center max-w-md leading-relaxed mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
