import { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { petsFacade } from "../facades/pets.facade"
import { authFacade } from "../../auth/facades/auth.facade"
import type { Pet } from "../models/pet.model"
import { PetCard } from "../components/PetCard"
import { Pagination } from "../components/Pagination"

export function PetsListPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [isAuthReady, setIsAuthReady] = useState(false)
  const isFirstLoad = useRef(true)
  const previousSearch = useRef("")

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
    if (!isAuthReady) return

    if (isFirstLoad.current) {
      isFirstLoad.current = false
      previousSearch.current = searchTerm
      const savedPage = pagination.page > 0 ? pagination.page : 1
      petsFacade.getAllPets(savedPage, searchTerm)
    } else if (searchTerm !== previousSearch.current) {
      previousSearch.current = searchTerm
      petsFacade.getAllPets(1, searchTerm)
    }
  }, [searchTerm, isAuthReady, pagination.page])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleClearSearch = () => {
    setSearchTerm("")
  }

  const handlePageChange = (newPage: number) => {
    if (isAuthReady) {
      petsFacade.getAllPets(newPage, searchTerm)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pets Disponíveis</h1>
          <p className="text-gray-500 mt-1">Encontre seu novo amigo</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Buscar por nome..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <Link
            to="/novo"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Novo Pet
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
        </div>
      )}

      {!loading && pets.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {!loading && pets.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhum pet encontrado
          </h3>
          <p className="text-gray-500 mb-4 max-w-md">
            {searchTerm
              ? `Não encontramos pets com o nome "${searchTerm}". Tente outro termo ou limpe o filtro.`
              : "Ainda não há pets cadastrados. Que tal adicionar o primeiro?"}
          </p>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
