export interface PetTutor {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  fotoUrl?: string;
  foto?: {
    id: number;
    url: string;
  };
}

export interface Pet {
  id: number;
  nome: string;
  especie: string;
  idade: number;
  raca: string;
  fotoUrl?: string;
  fotoId?: number;
  tutorId?: number;
  tutores?: PetTutor[];
}

export type PaginationState = {
  page: number;
  totalPages: number;
  totalElements: number;
};

export type PetFormData = Omit<Pet, "id"> & { id?: number };

export function hasTutor(pet: Pet): boolean {
  return Boolean(pet.tutorId || (pet.tutores && pet.tutores.length > 0))
}

export function getPetStatusMessage(pet: Pet): string {
  return hasTutor(pet) ? "Já tem um lar 💚" : "Procurando um lar 💛"
}
