import { describe, it, expect } from 'vitest';
import { petsFacade } from '../app/features/pets/state/pets.facade';

describe('PetsFacade', () => {
  it('existe e expõe state$', () => {
    expect(petsFacade).toBeTruthy();
    expect((petsFacade as any).state$).toBeTruthy();
  });
});
