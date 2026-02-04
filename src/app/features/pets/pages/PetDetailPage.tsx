import { useEffect, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { petsFacade } from "../facades/pets.facade"
import { authFacade } from "../../auth/facades/auth.facade"
import { toastStore } from "../../../shared/components/toast.store"
import type { Pet } from "../models/pet.model"
import { httpClient, API_ENDPOINTS } from "../../../core/api/api.client"

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [unlinkingTutorId, setUnlinkingTutorId] = useState<number | null>(null)

  useEffect(() => {
    const subLoading = petsFacade.isLoading$.subscribe(setLoading)
    const subPet = petsFacade.selectedPet$.subscribe(setPet)

    const subAuth = authFacade.isAuthenticated$.subscribe((authenticated) => {
      if (authenticated) {
        setIsAuthReady(true)
      }
    })

    authFacade.autoLogin().then(() => {
      setIsAuthReady(true)
    })

    return () => {
      subLoading.unsubscribe()
      subPet.unsubscribe()
      subAuth.unsubscribe()
      petsFacade.clearSelectedPet()
    }
  }, [])

  useEffect(() => {
    if (isAuthReady && id) {
      petsFacade.getPetById(Number(id))
    }
  }, [id, isAuthReady])

  const handleUnlinkTutor = async (tutorId: number) => {
    if (!pet) return

    const tutor = pet.tutores?.find((t) => t.id === tutorId)
    const confirmed = window.confirm(
      `Deseja realmente desvincular "${pet.nome}" do tutor "${tutor?.nome || "este tutor"}"?`,
    )

    if (!confirmed) return

    setUnlinkingTutorId(tutorId)

    try {
      await httpClient.delete(
        API_ENDPOINTS.tutores.linkPet(tutorId, pet.id),
      )
      toastStore.success(
        "Tutor desvinculado",
        `${pet.nome} não está mais vinculado a ${tutor?.nome || "este tutor"}.`,
      )
      petsFacade.getPetById(pet.id)
    } catch {
      toastStore.error("Erro", "Não foi possível desvincular o tutor.")
    } finally {
      setUnlinkingTutorId(null)
    }
  }

  const hasTutores = pet?.tutores && pet.tutores.length > 0

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-100 animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Carregando detalhes...
          </p>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Pet não encontrado
          </h2>
          <p className="text-gray-500 mb-6">
            O pet que você está procurando não existe ou foi removido.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar para listagem
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full transition-colors shadow-sm"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Perfil do Pet</h1>
        </div>

        <div className="bg-white rounded-4xl shadow-lg p-6 space-y-6">
          <div className="relative">
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-gray-100">
              {pet.fotoUrl ? (
                <img
                  src={pet.fotoUrl}
                  alt={pet.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                  <div className="text-center">
                    <span className="text-6xl">🐾</span>
                    <p className="mt-3 text-sm text-gray-400 font-medium">
                      Sem foto
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Informações Básicas
              </h2>
              <Link
                to={`/${pet.id}/editar`}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Editar
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">
                      Nome
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {pet.nome}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">
                      ID
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      #{pet.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">
                      Espécie
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate capitalize">
                      {pet.especie || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">
                      Raça
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {pet.raca}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-pink-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">
                      Idade
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {pet.idade} {pet.idade === 1 ? "ano" : "anos"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasTutores ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Tutores</h2>
                <Link
                  to={`/${pet.id}/vincular-tutor`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Vincular
                </Link>
              </div>

              <div className="space-y-3">
                {[...pet.tutores!]
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((tutor) => {
                    const fotoUrl = tutor.fotoUrl || tutor.foto?.url
                    return (
                      <div
                        key={tutor.id}
                        className="bg-gray-50 rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 p-0.5 shrink-0">
                            <div className="w-full h-full rounded-full bg-white overflow-hidden">
                              {fotoUrl ? (
                                <img
                                  src={fotoUrl}
                                  alt={tutor.nome}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                                  <svg
                                    className="w-6 h-6 text-emerald-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate mb-1">
                              {tutor.nome}
                            </h3>
                            {tutor.telefone && (
                              <p className="text-xs text-gray-500 truncate">
                                📞 {tutor.telefone}
                              </p>
                            )}
                            {tutor.email && (
                              <p className="text-xs text-gray-500 truncate">
                                ✉️ {tutor.email}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <Link
                              to={`/tutores/${tutor.id}`}
                              className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg transition-colors"
                              title="Ver perfil"
                            >
                              <svg
                                className="w-4 h-4 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleUnlinkTutor(tutor.id)}
                              disabled={unlinkingTutorId === tutor.id}
                              className="w-8 h-8 flex items-center justify-center bg-white hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Desvincular"
                            >
                              {unlinkingTutorId === tutor.id ? (
                                <svg
                                  className="w-4 h-4 text-red-500 animate-spin"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4 text-red-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Tutores</h2>
              </div>
              <div className="bg-indigo-50 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-3xl">💜</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Nenhum tutor vinculado
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Este pet ainda não possui um tutor responsável.
                </p>
                <Link
                  to={`/${pet.id}/vincular-tutor`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Vincular Tutor
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}