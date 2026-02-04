import { useEffect, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { tutoresFacade } from "../facades/tutores.facade"
import { authFacade } from "../../auth/facades/auth.facade"
import { toastStore } from "../../../shared/components/toast.store"
import type { Tutor } from "../models/tutor.model"
import type { LinkedPet } from "../facades/tutores.facade"

export function TutorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [linkedPets, setLinkedPets] = useState<LinkedPet[]>([])
  const [loading, setLoading] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [unlinkingPetId, setUnlinkingPetId] = useState<number | null>(null)

  useEffect(() => {
    const subLoading = tutoresFacade.isLoading$.subscribe(setLoading)
    const subTutor = tutoresFacade.selectedTutor$.subscribe(setTutor)
    const subPets = tutoresFacade.linkedPets$.subscribe(setLinkedPets)

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
      subTutor.unsubscribe()
      subPets.unsubscribe()
      subAuth.unsubscribe()
      tutoresFacade.clearSelectedTutor()
    }
  }, [])

  useEffect(() => {
    if (isAuthReady && id) {
      tutoresFacade.getTutorById(Number(id))
    }
  }, [id, isAuthReady])

  const handleUnlink = async (petId: number) => {
    if (!tutor) return

    const pet = linkedPets.find((p) => p.id === petId)
    const confirmed = window.confirm(
      `Deseja realmente desvincular "${pet?.nome || "este pet"}" do tutor "${tutor.nome}"?`,
    )

    if (!confirmed) return

    setUnlinkingPetId(petId)

    try {
      await tutoresFacade.unlinkPet(tutor.id, petId)
      toastStore.success(
        "Pet desvinculado",
        `${pet?.nome || "O pet"} foi desvinculado com sucesso.`,
      )
    } catch {
      toastStore.error("Erro", "Não foi possível desvincular o pet.")
    } finally {
      setUnlinkingPetId(null)
    }
  }

  const hasPets = linkedPets && linkedPets.length > 0

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-linear-to-b from-orange-400 to-amber-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Tutor não encontrado
          </h2>
          <p className="text-gray-500 mb-6">
            Este tutor pode ter sido removido.
          </p>
          <button
            onClick={() => navigate("/tutores")}
            className="w-full py-3 px-6 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all duration-300 hover:scale-[1.02]"
          >
            Voltar para Tutores
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="relative w-full">
        <div className="absolute inset-x-0 top-0 h-80 bg-linear-to-br bg-gray-100"></div>

        <div className="relative max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/tutores")}
              className="w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
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
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-black drop-shadow-sm">
              Perfil do Tutor
            </h1>
            <Link
              to={`/tutores/${tutor.id}/editar`}
              className="w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
            <div className="relative aspect-4/3 bg-linear-to-br from-purple-100 to-purple-50">
              {tutor.fotoUrl ? (
                <img
                  src={tutor.fotoUrl}
                  alt={tutor.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl opacity-50">👤</span>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <button className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-all duration-300">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {tutor.nome}
                  </h2>
                  <p className="text-gray-400 text-sm mt-0.5">Tutor de Pets</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-purple-50 text-purple-600 border border-purple-100">
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {tutor.telefone}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-100">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {tutor.endereco}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-6">
                {hasPets ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        Pets Adotados
                      </h3>
                      <Link
                        to={`/tutores/${tutor.id}/vincular`}
                        className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                      >
                        + Adicionar
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {[...linkedPets]
                        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                        .map((pet) => {
                          return (
                            <div
                              key={pet.id}
                              className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                            >
                              <div className="w-14 h-14 rounded-full bg-linear-to-br from-orange-400 to-orange-600 p-0.5 shrink-0">
                                <div className="w-full h-full rounded-full bg-white overflow-hidden">
                                  {pet.fotoUrl ? (
                                    <img
                                      src={pet.fotoUrl}
                                      alt={pet.nome}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                                      <span className="text-xl">🐾</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 truncate">
                                  {pet.nome}
                                </h4>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  {pet.especie} • {pet.raca} • {pet.idade}{" "}
                                  {pet.idade === 1 ? "ano" : "anos"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Link
                                  to={`/${pet.id}`}
                                  className="w-10 h-10 flex items-center justify-center bg-white hover:bg-purple-50 rounded-xl shadow-sm transition-colors"
                                >
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
                                  onClick={() => handleUnlink(pet.id)}
                                  disabled={unlinkingPetId === pet.id}
                                  className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                                >
                                  {unlinkingPetId === pet.id ? (
                                    <svg
                                      className="w-5 h-5 text-red-500 animate-spin"
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
                                      className="w-5 h-5 text-red-500"
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
                          )
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
                      <span className="text-3xl">🐾</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {tutor.nome} ainda não adotou nenhum pet!
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      Vincule pets para este tutor começar a cuidar deles.
                    </p>
                    <Link
                      to={`/tutores/${tutor.id}/vincular`}
                      className="block w-full py-4 px-6 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-lg rounded-2xl shadow-xl shadow-purple-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-300"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Vincular Pet
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
