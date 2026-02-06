import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { petsFacade } from "../../pets/facades/pets.facade"
import { tutoresFacade } from "../facades/tutores.facade"
import { authFacade } from "../../auth/facades/auth.facade"
import { toastStore } from "../../../shared/toast/toast.store"
import { ConfirmModal } from "../../../shared/components/ConfirmModal"
import type { Pet } from "../../pets/models/pet.model"
import { Pagination } from "../../pets/components/Pagination"
import { useDebounce } from "../../../shared/hooks/useDebounce"
import { useValidatedId } from "../../../shared/hooks/useValidatedId"

function LinkPetSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse"
        >
          <div className="aspect-4/3 bg-linear-to-br from-gray-200 via-gray-100 to-gray-200" />
          <div className="p-5">
            <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-3" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/2 mb-4" />
            <div className="h-10 bg-gray-200 rounded-xl w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function PetLinkCard({
  pet,
  isLinking,
  disabled,
  onLink,
}: {
  pet: Pet
  isLinking: boolean
  disabled: boolean
  onLink: () => void
}) {
  return (
    <article className="group bg-white rounded-2xl overflow-hidden shadow-lg shadow-gray-200/60 hover:shadow-2xl hover:shadow-emerald-200/40 transition-all duration-500 ease-out transform hover:-translate-y-1 border border-gray-100/80">
      <div className="relative aspect-4/3 overflow-hidden bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
        {pet.fotoUrl ? (
          <img
            src={pet.fotoUrl}
            alt={pet.nome}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200/50 group-hover:scale-110 transition-transform duration-500">
              <span className="text-4xl">🐾</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-emerald-600 shadow-lg">
            <span className="text-sm">🐾</span>
            Pet
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 truncate group-hover:text-emerald-600 transition-colors duration-300">
            {pet.nome}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              {pet.especie}
            </span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500 font-medium truncate">
              {pet.raca}
            </span>
          </div>
        </div>

        <button
          onClick={onLink}
          disabled={disabled}
          className={`
            relative w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden
            ${
              isLinking
                ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white cursor-wait"
                : disabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-linear-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg hover:shadow-emerald-200/50 cursor-pointer active:scale-[0.98]"
            }
          `}
        >
          <span
            className={`flex items-center justify-center gap-2 ${isLinking ? "opacity-0" : "opacity-100"}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
            </svg>
            Vincular Pet
          </span>

          {isLinking && (
            <span className="absolute inset-0 flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 animate-spin"
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
              Vinculando...
            </span>
          )}
        </button>
      </div>
    </article>
  )
}

export function LinkPetPage() {
  const { id: tutorId, isValid } = useValidatedId({
    fallbackRoute: "/tutores",
  })
  const navigate = useNavigate()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState<number | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 400)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    pet: Pet | null
  }>({
    isOpen: false,
    pet: null,
  })

  useEffect(() => {
    const subPets = petsFacade.pets$.subscribe(setPets)
    const subLoading = petsFacade.isLoading$.subscribe(setLoading)
    const subPagination = petsFacade.pagination$.subscribe((p) => {
      setPagination({ page: p.page, totalPages: p.totalPages })
    })

    const subAuth = authFacade.isAuthenticated$.subscribe((authenticated) => {
      if (authenticated) {
        setIsAuthReady(true)
      }
    })

    authFacade.autoLogin().then(() => {
      setIsAuthReady(true)
    })

    return () => {
      subPets.unsubscribe()
      subLoading.unsubscribe()
      subPagination.unsubscribe()
      subAuth.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isAuthReady && isValid) {
      petsFacade.getAllPets(1, debouncedSearch)
    }
  }, [isAuthReady, isValid, debouncedSearch])

  const handlePageChange = (newPage: number) => {
    if (isAuthReady && isValid) {
      petsFacade.getAllPets(newPage, debouncedSearch)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const openConfirmModal = (pet: Pet) => {
    setConfirmModal({ isOpen: true, pet })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, pet: null })
  }

  const handleConfirmLink = async () => {
    if (!confirmModal.pet || !tutorId) return

    const petId = confirmModal.pet.id as number
    setLinking(petId)

    try {
      await tutoresFacade.linkPet(tutorId, petId)
      closeConfirmModal()
      toastStore.success(
        "Pet vinculado",
        "O pet foi vinculado ao tutor com sucesso.",
      )
      navigate(`/tutores/${tutorId}`, { replace: true })
    } catch {
      toastStore.error("Erro", "Não foi possível vincular o pet.")
      setLinking(null)
    }
  }

  return (
    <>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Vincular Pet"
        message={`Deseja vincular "${confirmModal.pet?.nome}" aos cuidados deste tutor?`}
        confirmLabel="Vincular"
        cancelLabel="Cancelar"
        variant="success"
        isLoading={linking !== null}
        onConfirm={handleConfirmLink}
        onCancel={closeConfirmModal}
      />

      <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <header className="mb-10">
            <button
              onClick={() => navigate(`/tutores/${tutorId}`)}
              className="group inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-medium mb-6 transition-colors duration-300 cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center group-hover:shadow-lg group-hover:bg-emerald-50 transition-all duration-300">
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </span>
              <span>Voltar ao tutor</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold mb-3">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
                  </svg>
                  Vinculação
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                  Vincular Pet
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                  Escolha um pet para adicionar aos cuidados deste tutor
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar pet por nome..."
                  aria-label="Buscar pet por nome"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-700 placeholder-gray-400 font-medium shadow-sm"
                />
              </div>
            </div>
          </header>

          {loading && <LinkPetSkeleton />}

          {!loading && pets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-6 bg-linear-to-b from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="w-28 h-28 rounded-full bg-linear-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6 shadow-xl shadow-emerald-100/50">
                <span className="text-5xl">🐾</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Nenhum pet encontrado
              </h2>
              <p className="text-gray-500 text-center max-w-md mb-6">
                {searchTerm
                  ? `Não encontramos pets com o termo "${searchTerm}".`
                  : "Não há pets cadastrados. Comece cadastrando um novo pet."}
              </p>
              <button
                onClick={() => navigate("/novo")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 cursor-pointer active:scale-[0.98]"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Cadastrar novo pet
              </button>
            </div>
          )}

          {!loading && pets.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map((pet) => (
                  <PetLinkCard
                    key={pet.id}
                    pet={pet}
                    isLinking={linking === pet.id}
                    disabled={linking !== null}
                    onLink={() => openConfirmModal(pet)}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-10">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
