import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { petsFacade } from "../facades/pets.facade"
import { authFacade } from "../../auth/facades/auth.facade"
import { toastStore } from "../../../shared/components/toast.store"
import { ImageUpload } from "../../../shared/components/ImageUpload"
import { ConfirmModal } from "../../../shared/components/ConfirmModal"
import type { PetFormData } from "../models/pet.model"

export function PetFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [photoMarkedForDeletion, setPhotoMarkedForDeletion] = useState(false)
  const [currentFotoId, setCurrentFotoId] = useState<number | undefined>()
  const [formData, setFormData] = useState<PetFormData>({
    nome: "",
    especie: "Cachorro",
    idade: 0,
    raca: "",
  })

  useEffect(() => {
    const subLoading = petsFacade.isLoading$.subscribe(setLoading)
    const subSaving = petsFacade.isSaving$.subscribe(setSaving)
    const subPet = petsFacade.selectedPet$.subscribe((pet) => {
      if (pet && isEditMode) {
        setFormData({
          id: pet.id,
          nome: pet.nome,
          especie: pet.especie,
          idade: pet.idade,
          raca: pet.raca,
          fotoUrl: pet.fotoUrl,
        })
        setCurrentFotoId(pet.fotoId)
      }
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
      subLoading.unsubscribe()
      subSaving.unsubscribe()
      subPet.unsubscribe()
      subAuth.unsubscribe()
    }
  }, [isEditMode])

  useEffect(() => {
    if (isAuthReady) {
      if (isEditMode) {
        petsFacade.getPetById(Number(id))
      } else {
        petsFacade.clearSelectedPet()
      }
    }
  }, [id, isEditMode, isAuthReady])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "idade" ? Number(value) : value,
    }))
  }

  const handleDeletePhoto = () => {
    setPhotoMarkedForDeletion(true)
    setFormData((prev) => ({ ...prev, fotoUrl: undefined }))
    setShowDeleteModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const savedPet = await petsFacade.savePet(formData)

      if (photoMarkedForDeletion && formData.id && currentFotoId) {
        await petsFacade.deletePhoto(formData.id, currentFotoId)
      }

      if (selectedFile && savedPet?.id) {
        await petsFacade.uploadPhoto(savedPet.id, selectedFile)
      }

      toastStore.success(
        isEditMode ? "Pet atualizado!" : "Pet cadastrado!",
        `${formData.nome} foi salvo com sucesso.`,
      )

      navigate("/")
    } catch {
      toastStore.error("Erro ao salvar", "Não foi possível salvar o pet.")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 mb-6 transition-colors group"
      >
        <svg
          className="w-4 h-4 transition-transform group-hover:-translate-x-1"
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
        Voltar para lista
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {isEditMode ? "Editar Pet" : "Cadastrar Novo Pet"}
        </h1>
        <p className="text-gray-500 mt-2">
          {isEditMode
            ? "Atualize as informações do pet"
            : "Preencha os dados para cadastrar um novo pet"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 space-y-6 border border-gray-100"
      >
        <div className="flex flex-col items-center gap-3">
          <ImageUpload
            currentImageUrl={formData.fotoUrl}
            onFileSelect={setSelectedFile}
            label="Foto do Pet"
            shape="circle"
          />
          {isEditMode &&
            !photoMarkedForDeletion &&
            formData.fotoUrl &&
            currentFotoId && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remover Foto
              </button>
            )}
        </div>

        <div>
          <label
            htmlFor="nome"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Nome
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Digite o nome do pet"
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:border-transparent focus:bg-white outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="grid gap-6">
          <div>
            <label
              htmlFor="idade"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Idade (anos)
            </label>
            <input
              type="number"
              id="idade"
              name="idade"
              value={formData.idade}
              onChange={handleChange}
              min={0}
              max={30}
              placeholder="0"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:border-transparent focus:bg-white outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="raca"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Raça
          </label>
          <input
            type="text"
            id="raca"
            name="raca"
            value={formData.raca}
            onChange={handleChange}
            placeholder="Digite a raça do pet"
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:border-transparent focus:bg-white outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98]"
          >
            {saving && (
              <svg
                className="animate-spin h-4 w-4"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 active:scale-[0.98]"
          >
            Cancelar
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Remover Foto"
        message="A foto será removida quando você salvar as alterações."
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        isLoading={false}
        variant="warning"
        onConfirm={handleDeletePhoto}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
