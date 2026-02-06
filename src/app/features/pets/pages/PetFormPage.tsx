import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { petsFacade } from "../facades/pets.facade"
import { authFacade } from "../../auth/facades/auth.facade"
import { toastStore } from "../../../shared/toast/toast.store"
import { ImageUpload } from "../../../shared/components/ImageUpload"
import { ConfirmModal } from "../../../shared/components/ConfirmModal"
import { Spinner } from "../../../shared/components/Spinner"
import { useMask } from "../../../shared/hooks/useMask"
import { useValidatedId } from "../../../shared/hooks/useValidatedId"
import type { PetFormData } from "../models/pet.model"

export function PetFormPage() {
  const { id, isValid } = useValidatedId({ fallbackRoute: "/" })
  const navigate = useNavigate()
  const isEditMode = isValid && id !== null
  const { onlyNumbers } = useMask()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false)
  const [showDeletePetModal, setShowDeletePetModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
      if (isEditMode && id) {
        petsFacade.getPetById(id)
      } else {
        petsFacade.clearSelectedPet()
      }
    }
  }, [id, isEditMode, isAuthReady])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    if (name === "idade") {
      const numericValue = onlyNumbers(value)
      setFormData((prev) => ({
        ...prev,
        idade: numericValue ? Number(numericValue) : 0,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleDeletePhoto = () => {
    setPhotoMarkedForDeletion(true)
    setFormData((prev) => ({ ...prev, fotoUrl: undefined }))
    setShowDeleteModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode) {
      setShowSaveConfirmModal(true)
    } else {
      await handleConfirmSave()
    }
  }

  const handleConfirmSave = async () => {
    setShowSaveConfirmModal(false)

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

  const handleDeletePet = async () => {
    if (!formData.id) return

    setIsDeleting(true)

    try {
      await petsFacade.deletePet(formData.id)
      toastStore.success(
        "Pet removido",
        `${formData.nome} foi removido com sucesso.`,
      )
      navigate("/")
    } catch (error: unknown) {
      const isAuthError =
        error &&
        typeof error === "object" &&
        ("isAuthError" in error
          ? (error as { isAuthError?: boolean }).isAuthError === true
          : false)

      if (isAuthError) {
        navigate("/login")
        return
      }

      toastStore.error("Erro", "Não foi possível remover o pet.")
    } finally {
      setIsDeleting(false)
      setShowDeletePetModal(false)
    }
  }

  if (loading) {
    return <Spinner variant="orange" size="lg" />
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600 mb-6 transition-all duration-200 group hover:gap-3"
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

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/30">
                  <svg
                    className="w-7 h-7"
                    viewBox="0 0 48.839 48.839"
                    fill="white"
                  >
                    <path d="M39.041,36.843c2.054,3.234,3.022,4.951,3.022,6.742c0,3.537-2.627,5.252-6.166,5.252 c-1.56,0-2.567-0.002-5.112-1.326c0,0-1.649-1.509-5.508-1.354c-3.895-0.154-5.545,1.373-5.545,1.373 c-2.545,1.323-3.516,1.309-5.074,1.309c-3.539,0-6.168-1.713-6.168-5.252c0-1.791,0.971-3.506,3.024-6.742 c0,0,3.881-6.445,7.244-9.477c2.43-2.188,5.973-2.18,5.973-2.18h1.093v-0.001c0,0,3.698-0.009,5.976,2.181 C35.059,30.51,39.041,36.844,39.041,36.843z M16.631,20.878c3.7,0,6.699-4.674,6.699-10.439S20.331,0,16.631,0 S9.932,4.674,9.932,10.439S12.931,20.878,16.631,20.878z M10.211,30.988c2.727-1.259,3.349-5.723,1.388-9.971 s-5.761-6.672-8.488-5.414s-3.348,5.723-1.388,9.971C3.684,29.822,7.484,32.245,10.211,30.988z M32.206,20.878 c3.7,0,6.7-4.674,6.7-10.439S35.906,0,32.206,0s-6.699,4.674-6.699,10.439C25.507,16.204,28.506,20.878,32.206,20.878z M45.727,15.602c-2.728-1.259-6.527,1.165-8.488,5.414s-1.339,8.713,1.389,9.972c2.728,1.258,6.527-1.166,8.488-5.414 S48.455,16.861,45.727,15.602z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    {isEditMode ? "Editar Pet" : "Cadastrar Novo Pet"}
                  </h1>
                  <p className="text-gray-600 mt-1 text-lg">
                    {isEditMode
                      ? "Atualize as informações do pet"
                      : "Preencha os dados para cadastrar um novo pet"}
                  </p>
                </div>
              </div>
            </div>
            {isEditMode && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                Modo Edição
              </span>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 border border-gray-200 overflow-hidden"
        >
          <div className="h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />

          <div className="p-10 space-y-8">
            <div className="flex flex-col items-center gap-4 pb-8 border-b border-gray-100">
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
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

            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Informações do Pet
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>

              <div className="group">
                <label
                  htmlFor="nome"
                  className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3"
                >
                  <svg
                    className="w-5 h-5 text-orange-500"
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
                  Nome do Pet
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Digite o nome do pet"
                  required
                  className="w-full px-5 py-4 text-base bg-gradient-to-br from-gray-50 to-orange-50/30 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-orange-300 shadow-sm"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="group">
                  <label
                    htmlFor="idade"
                    className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3"
                  >
                    <svg
                      className="w-5 h-5 text-orange-500"
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
                    Idade (anos)
                    <span className="text-red-500">*</span>
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
                    className="w-full px-5 py-4 text-base bg-gradient-to-br from-gray-50 to-orange-50/30 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-orange-300 shadow-sm"
                  />
                </div>

                <div className="group">
                  <label
                    htmlFor="raca"
                    className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3"
                  >
                    <svg
                      className="w-5 h-5 text-orange-500"
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
                    Raça
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="raca"
                    name="raca"
                    value={formData.raca}
                    onChange={handleChange}
                    placeholder="Digite a raça do pet"
                    required
                    className="w-full px-5 py-4 text-base bg-gradient-to-br from-gray-50 to-orange-50/30 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-orange-300 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-8 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-orange-500/50 active:scale-[0.97] shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  {saving ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
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
                      <span className="relative z-10">Salvando...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 relative z-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="relative z-10">Salvar Pet</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(isEditMode && id ? `/${id}` : "/")}
                  className="flex-1 inline-flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 px-8 rounded-2xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-gray-300/50 active:scale-[0.97] shadow-sm hover:shadow-md"
                >
                  <svg
                    className="w-5 h-5"
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
                  Cancelar
                </button>{" "}
              </div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowDeletePetModal(true)}
                  disabled={isDeleting}
                  className="w-full inline-flex items-center justify-center gap-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold py-4 px-8 rounded-2xl border-2 border-red-200 hover:border-red-600 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-red-500/50 active:scale-[0.97] shadow-sm hover:shadow-lg hover:shadow-red-500/30"
                >
                  <svg
                    className="w-5 h-5"
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
                  Remover Pet
                </button>
              )}
            </div>
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

        <ConfirmModal
          isOpen={showSaveConfirmModal}
          title="Confirmar Alterações"
          message={`Deseja confirmar as alterações feitas em ${formData.nome}? Esta ação atualizará os dados do pet.`}
          confirmLabel={saving ? "Salvando..." : "Confirmar e Salvar"}
          cancelLabel="Cancelar"
          isLoading={saving}
          variant="success"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowSaveConfirmModal(false)}
        />

        <ConfirmModal
          isOpen={showDeletePetModal}
          title="Remover Pet"
          message={`Deseja realmente remover "${formData.nome}" permanentemente? Esta ação não pode ser desfeita.`}
          confirmLabel="Remover"
          cancelLabel="Cancelar"
          isLoading={isDeleting}
          variant="danger"
          onConfirm={handleDeletePet}
          onCancel={() => setShowDeletePetModal(false)}
        />
      </div>
    </div>
  )
}
