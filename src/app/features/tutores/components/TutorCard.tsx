import { Link } from "react-router-dom"
import type { Tutor } from "../models/tutor.model"

interface TutorCardProps {
  tutor: Tutor;
}

export function TutorCard({ tutor }: TutorCardProps) {
  const displayPhone = tutor.telefone?.substring(0, 15) || "Sem telefone"

  return (
    <Link to={`/tutores/${tutor.id}`} className="block group">
      <article className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-200/30 overflow-hidden transition-all duration-500 ease-out transform hover:-translate-y-2 hover:scale-[1.02] border border-gray-100/50">
        <div className="relative aspect-square overflow-hidden bg-linear-to-br from-blue-100 via-cyan-50 to-blue-100">
          {tutor.fotoUrl ? (
            <img
              src={tutor.fotoUrl}
              alt={tutor.nome}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 group-hover:scale-110 inline-block transform">
                  👤
                </span>
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-blue-600 shadow-lg shadow-blue-100/50">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {displayPhone}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-300 hover:scale-110">
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-black/20 to-transparent" />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors duration-300">
                {tutor.nome}
              </h3>
              <p className="text-sm text-gray-400 font-medium mt-0.5">
                Tutor responsável 💙
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:shadow-blue-300 transition-all duration-300 group-hover:scale-110 shrink-0">
              <svg
                className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              {tutor.endereco?.substring(0, 20) || "Endereço"}
              {tutor.endereco && tutor.endereco.length > 20 ? "..." : ""}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
