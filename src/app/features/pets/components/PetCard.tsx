import { Link } from "react-router-dom"
import type { Pet } from "../models/pet.model"

interface PetCardProps {
  pet: Pet;
}

export function PetCard({ pet }: PetCardProps) {
  return (
    <article className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-gray-200 overflow-hidden transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {pet.fotoUrl ? (
          <img
            src={pet.fotoUrl}
            alt={pet.nome}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-50 group-hover:opacity-70 transition-opacity duration-300">
              🐾
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-blue-700 shadow-sm">
            {pet.idade} {pet.idade === 1 ? "ano" : "anos"}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight group-hover:text-blue-700 transition-colors duration-200">
            {pet.nome}
          </h3>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">
            {pet.raca}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <Link
            to={`/${pet.id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
          >
            Ver Detalhes
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
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
          </Link>
        </div>
      </div>
    </article>
  )
}
