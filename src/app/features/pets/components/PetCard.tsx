import type { Pet } from "../models/pet.model";

interface PetCardProps {
  pet: Pet;
}

export function PetCard({ pet }: PetCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
      <div className="h-48 bg-gray-200 w-full object-cover flex items-center justify-center">
        {pet.fotoUrl ? (
          <img
            src={pet.fotoUrl}
            alt={pet.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">🐾</span>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-blue-700 mb-1">{pet.nome}</h3>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
              {pet.especie}
            </p>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {pet.idade} anos
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <button className="w-full text-blue-600 hover:text-blue-800 text-sm font-semibold">
            Ver Detalhes →
          </button>
        </div>
      </div>
    </div>
  );
}