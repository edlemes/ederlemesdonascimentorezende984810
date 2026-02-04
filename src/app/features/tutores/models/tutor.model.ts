export interface Tutor {
  id: number;
  nome: string;
  telefone: string;
  endereco: string;
  fotoUrl?: string;
  fotoId?: number;
}

export type TutorFormData = Omit<Tutor, "id"> & { id?: number };
