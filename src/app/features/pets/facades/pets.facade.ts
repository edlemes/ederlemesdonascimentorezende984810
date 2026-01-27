import { BehaviorSubject } from "rxjs";
import type { Pet } from "../models/pet.model";

const MOCK_PETS: Pet[] = [
  { id: 1, nome: "Rex", especie: "CACHORRO", idade: 5, raca: "Vira-lata" },
  { id: 2, nome: "Mia", especie: "GATO", idade: 2, raca: "Siamês" },
];

class PetsFacadeImpl {
  private petsSubject = new BehaviorSubject<Pet[]>([]);
  public pets$ = this.petsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.loadingSubject.asObservable();

  constructor() {
    this.loadPets();
  }

  loadPets() {
    this.loadingSubject.next(true);

    setTimeout(() => {
      this.petsSubject.next(MOCK_PETS);
      this.loadingSubject.next(false);
    }, 500);
  }
}

export const petsFacade = new PetsFacadeImpl();