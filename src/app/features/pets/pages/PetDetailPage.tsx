import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { petsFacade } from "../facades/pets.facade"
import { authFacade } from "../../auth/facades/auth.facade"
import { tutoresFacade } from "../../tutores/facades/tutores.facade"
import { toastStore } from "../../../shared/toast/toast.store"
import { Spinner } from "../../../shared/components/Spinner"
import { ConfirmModal } from "../../../shared/components/ConfirmModal"
import { useValidatedId } from "../../../shared/hooks/useValidatedId"
import type { Pet } from "../models/pet.model"
import type { PetTutor } from "../models/pet.model"

export function PetDetailPage() {
  const { id, isValid } = useValidatedId({ fallbackRoute: "/" })
  const navigate = useNavigate()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [unlinkingTutorId, setUnlinkingTutorId] = useState<number | null>(null)
  const [unlinkModal, setUnlinkModal] = useState<{
    isOpen: boolean
    tutor: PetTutor | null
  }>({
    isOpen: false,
    tutor: null,
  })

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
    if (isAuthReady && isValid && id) {
      petsFacade.getPetById(id)
    }
  }, [id, isValid, isAuthReady])

  const openUnlinkModal = (tutor: PetTutor) => {
    setUnlinkModal({ isOpen: true, tutor })
  }

  const closeUnlinkModal = () => {
    setUnlinkModal({ isOpen: false, tutor: null })
  }

  const handleConfirmUnlink = async () => {
    if (!pet || !unlinkModal.tutor) return

    const tutor = unlinkModal.tutor
    setUnlinkingTutorId(tutor.id)

    try {
      await tutoresFacade.unlinkPet(tutor.id, pet.id)
      closeUnlinkModal()
      toastStore.success(
        "Tutor desvinculado",
        `${pet.nome} não está mais vinculado a ${tutor.nome}.`,
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
    return <Spinner variant="orange" size="lg" />
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-linear-to-b from-orange-400 to-amber-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-4xl">🐾</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Pet não encontrado
          </h2>
          <p className="text-gray-500 mb-6">
            Este pet pode ter sido adotado ou removido.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 px-6 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            Voltar para Pets
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <ConfirmModal
        isOpen={unlinkModal.isOpen}
        title="Desvincular Tutor"
        message={`Deseja realmente desvincular "${pet?.nome}" do tutor "${unlinkModal.tutor?.nome}"?`}
        confirmLabel="Desvincular"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={unlinkingTutorId !== null}
        onConfirm={handleConfirmUnlink}
        onCancel={closeUnlinkModal}
      />

      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
        <div className="relative w-full">
          <div className="absolute inset-x-0 top-0 h-80 bg-linear-to-br bg-gray-100"></div>

          <div className="relative max-w-lg mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate("/")}
                aria-label="Voltar para lista de pets"
                className="w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
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
                Perfil do Pet
              </h1>
              <Link
                to={`/${pet.id}/editar`}
                aria-label="Editar pet"
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
              <div className="relative aspect-4/3 bg-linear-to-br from-orange-100 to-amber-50">
                {pet.fotoUrl ? (
                  <img
                    src={pet.fotoUrl}
                    alt={pet.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl opacity-50">🐾</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {pet.nome}
                    </h2>
                    <p className="text-gray-400 text-sm mt-0.5">{pet.raca}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-purple-50 text-orange-600 border border-purple-100">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {pet.idade} {pet.idade === 1 ? "ano" : "anos"}
                  </span>
                  {pet.especie && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                      <span>🐕</span>
                      {pet.especie}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-100">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Disponível
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  {hasTutores ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">
                          Tutor Responsável
                        </h3>
                        <Link
                          to={`/${pet.id}/vincular-tutor`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          + Adicionar
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
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                              >
                                <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-400 to-blue-600 p-0.5 shrink-0">
                                  <div className="w-full h-full rounded-full bg-white overflow-hidden">
                                    {fotoUrl ? (
                                      <img
                                        src={fotoUrl}
                                        alt={tutor.nome}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                                        <span className="text-xl">👤</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-800 truncate">
                                    {tutor.nome}
                                  </h4>
                                  {tutor.telefone && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
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
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Link
                                    to={`/tutores/${tutor.id}`}
                                    aria-label={`Ver perfil de ${tutor.nome}`}
                                    className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50 rounded-xl shadow-sm transition-colors"
                                  >
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
                                    onClick={() => openUnlinkModal(tutor)}
                                    disabled={unlinkingTutorId === tutor.id}
                                    aria-label={`Desvincular ${tutor.nome}`}
                                    className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {unlinkingTutorId === tutor.id ? (
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
                        <span className="text-3xl">💜</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {pet.nome} precisa de um lar!
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        Este pet ainda não tem um tutor responsável.
                      </p>
                      <Link
                        to={`/${pet.id}/vincular-tutor`}
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
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          Encontre um tutor para {pet.nome}
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
    </>
  )
}
