import { Link } from "react-router-dom"
import type { Pet } from "../models/pet.model"
import { getPetStatusMessage } from "../models/pet.model"

interface PetCardProps {
  pet: Pet
}

export function PetCard({ pet }: PetCardProps) {
  return (
    <Link to={`/${pet.id}`} className="block group">
      <article className="bg-white rounded-3xl shadow-lg shadow-gray-300 hover:shadow-xl hover:shadow-orange-200/80 overflow-hidden transition-all duration-500 ease-out transform hover:-translate-y-2 hover:scale-[1.02] border border-gray-100/50">
        <div className="relative aspect-square overflow-hidden bg-linear-to-br from-orange-100 via-amber-50 to-orange-100">
          {pet.fotoUrl ? (
            <img
              src={pet.fotoUrl}
              alt={pet.nome}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 group-hover:scale-110 inline-block transform">
                  🐾
                </span>
              </div>
            </div>
          )}

          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-orange-600 shadow-lg shadow-orange-100/50">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              {pet.idade} {pet.idade === 1 ? "ano" : "anos"}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-black/20 to-transparent" />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors duration-300">
                {pet.nome}
              </h3>
              <p className="text-sm text-gray-400 font-medium mt-0.5">
                {getPetStatusMessage(pet)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:shadow-orange-300 transition-all duration-300 group-hover:scale-110 shrink-0">
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
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              {pet.raca}
            </span>
            {pet.especie && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                {pet.especie}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}