import { describe, it, expect } from "vitest"
import { API_ENDPOINTS } from "../../app/core/api/api.endpoints"

describe("API_ENDPOINTS", () => {
  describe("auth", () => {
    it("retorna endpoint de login", () => {
      expect(API_ENDPOINTS.auth.login).toBe("/autenticacao/login")
    })

    it("retorna endpoint de refresh", () => {
      expect(API_ENDPOINTS.auth.refresh).toBe("/autenticacao/refresh")
    })
  })

  describe("health", () => {
    it("retorna endpoint de health check", () => {
      expect(API_ENDPOINTS.health.check).toBe("/q/health")
    })
  })

  describe("pets", () => {
    it("retorna endpoint base", () => {
      expect(API_ENDPOINTS.pets.base).toBe("/v1/pets")
    })

    it("retorna endpoint byId com id", () => {
      expect(API_ENDPOINTS.pets.byId(1)).toBe("/v1/pets/1")
      expect(API_ENDPOINTS.pets.byId(42)).toBe("/v1/pets/42")
    })

    it("retorna endpoint photos com id", () => {
      expect(API_ENDPOINTS.pets.photos(1)).toBe("/v1/pets/1/fotos")
      expect(API_ENDPOINTS.pets.photos(99)).toBe("/v1/pets/99/fotos")
    })

    it("retorna endpoint photoById com id e photoId", () => {
      expect(API_ENDPOINTS.pets.photoById(1, 5)).toBe("/v1/pets/1/fotos/5")
      expect(API_ENDPOINTS.pets.photoById(42, 10)).toBe("/v1/pets/42/fotos/10")
    })
  })

  describe("tutores", () => {
    it("retorna endpoint base", () => {
      expect(API_ENDPOINTS.tutores.base).toBe("/v1/tutores")
    })

    it("retorna endpoint byId com id", () => {
      expect(API_ENDPOINTS.tutores.byId(1)).toBe("/v1/tutores/1")
      expect(API_ENDPOINTS.tutores.byId(42)).toBe("/v1/tutores/42")
    })

    it("retorna endpoint photos com id", () => {
      expect(API_ENDPOINTS.tutores.photos(1)).toBe("/v1/tutores/1/fotos")
      expect(API_ENDPOINTS.tutores.photos(99)).toBe("/v1/tutores/99/fotos")
    })

    it("retorna endpoint linkPet com tutorId e petId", () => {
      expect(API_ENDPOINTS.tutores.linkPet(1, 5)).toBe("/v1/tutores/1/pets/5")
      expect(API_ENDPOINTS.tutores.linkPet(42, 10)).toBe(
        "/v1/tutores/42/pets/10",
      )
    })

    it("retorna endpoint photoById com id e photoId", () => {
      expect(API_ENDPOINTS.tutores.photoById(1, 5)).toBe(
        "/v1/tutores/1/fotos/5",
      )
      expect(API_ENDPOINTS.tutores.photoById(42, 10)).toBe(
        "/v1/tutores/42/fotos/10",
      )
    })
  })
})
