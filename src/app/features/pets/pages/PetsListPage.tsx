import { useEffect, useState } from "react";
import type { Pet } from "../models/pet.model";
import { petsFacade } from "../facades/pets.facade";
import { PetCard } from "../components/PetCard";

export function PetsListPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const petsSubscription = petsFacade.pets$.subscribe((data) => {
      setPets(data);
    });

    const loadingSubscription = petsFacade.isLoading$.subscribe((isLoading) => {
      setLoading(isLoading);
    });

    petsFacade.loadPets();

    return () => {
      petsSubscription.unsubscribe();
      loadingSubscription.unsubscribe();
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Pets Disponíveis para Adoção
        </h1>
        <p className="text-gray-600 mt-2">
          Encontre seu novo melhor amigo no estado de Mato Grosso.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}

      {!loading && pets.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhum pet encontrado no momento.</p>
        </div>
      )}
    </div>
  );
}
