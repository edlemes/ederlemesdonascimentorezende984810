interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  variant?: "orange" | "blue"
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = "orange",
}: PaginationProps) {
  const isFirst = currentPage === 1
  const isLast = currentPage === totalPages
  const activeColor = variant === "orange" ? "bg-orange-600" : "bg-blue-600"

  return (
    <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-10 px-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        aria-label="Página anterior"
        className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 ${
          isFirst
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm cursor-pointer focus:ring-blue-500"
        }`}
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <div className="flex items-center gap-1 px-1 sm:px-4">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number
          if (totalPages <= 5) {
            pageNum = i + 1
          } else if (currentPage <= 3) {
            pageNum = i + 1
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i
          } else {
            pageNum = currentPage - 2 + i
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95 ${
                currentPage === pageNum
                  ? `${activeColor} text-white shadow-md`
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {pageNum}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        aria-label="Próxima página"
        className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 ${
          isLast
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm cursor-pointer focus:ring-blue-500"
        }`}
      >
        <span className="hidden sm:inline">Próximo</span>
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  )
}
