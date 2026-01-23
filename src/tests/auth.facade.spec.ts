import { describe, it, expect } from 'vitest';
import { authFacade } from '../app/core/auth/auth.facade';

describe('AuthFacade', () => {
  it('existe e expõe streams', () => {
    expect(authFacade).toBeTruthy();
    expect((authFacade as any).auth$).toBeTruthy();
  });
});
