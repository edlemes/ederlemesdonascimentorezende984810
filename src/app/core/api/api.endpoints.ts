export const API_ENDPOINTS = {
  auth: {
    login: '/autenticacao/login',
    refresh: '/autenticacao/refresh',
  },
  health: {
    check: '/v1/health',
  },
  pets: {
    base: '/v1/pets',
    byId: (id: number) => `/v1/pets/${id}`,
    photos: (id: number) => `/v1/pets/${id}/fotos`,
    photoById: (id: number, photoId: number) => `/v1/pets/${id}/fotos/${photoId}`,
  },
  tutores: {
    base: '/v1/tutores',
    byId: (id: number) => `/v1/tutores/${id}`,
    photos: (id: number) => `/v1/tutores/${id}/fotos`,
    linkPet: (tutorId: number, petId: number) => `/v1/tutores/${tutorId}/pets/${petId}`,
    photoById: (id: number, photoId: number) => `/v1/tutores/${id}/fotos/${photoId}`,
  },
} as const;