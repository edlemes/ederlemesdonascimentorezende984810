import { Link, useLocation } from "react-router-dom"
import { ApiStatus } from "../../shared/components/ApiStatus"

export function Navbar() {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === "/") {
      return (
        location.pathname === "/" ||
        (!location.pathname.startsWith("/tutores") &&
          !location.pathname.startsWith("/login"))
      )
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header className="sticky md:relative top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-linear-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 group-hover:shadow-lg group-hover:shadow-orange-300 transition-all duration-300 group-hover:scale-105">
              <span className="text-xl">🐾</span>
            </div>
            <span className="text-lg font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent hidden sm:block">
              Pata Digital
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="flex gap-1.5 p-1.5 bg-gray-100/80 rounded-xl">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  isActive("/")
                    ? "bg-white text-orange-600 shadow-md shadow-orange-100"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Pets</span>
              </Link>
              <Link
                to="/tutores"
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  isActive("/tutores")
                    ? "bg-white text-blue-600 shadow-md shadow-blue-100"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Tutores</span>
              </Link>
            </nav>

            <div className="hidden sm:block">
              <ApiStatus />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
