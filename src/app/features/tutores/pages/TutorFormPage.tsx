import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { tutoresFacade } from "../facades/tutores.facade"
import { authFacade } from "../../auth/facades/auth.facade"
import { toastStore } from "../../../shared/toast/toast.store"
import { ImageUpload } from "../../../shared/components/ImageUpload"
import { ConfirmModal } from "../../../shared/components/ConfirmModal"
import { Spinner } from "../../../shared/components/Spinner"
import { useMask } from "../../../shared/hooks/useMask"
import { useValidatedId } from "../../../shared/hooks/useValidatedId"
import type { TutorFormData } from "../models/tutor.model"

export function TutorFormPage() {
  const { id, isValid } = useValidatedId({ fallbackRoute: "/tutores" })
  const navigate = useNavigate()
  const isEditMode = isValid && id !== null
  const { phone, cpf: cpfMask } = useMask()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false)
  const [showDeleteTutorModal, setShowDeleteTutorModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [photoMarkedForDeletion, setPhotoMarkedForDeletion] = useState(false)
  const [currentFotoId, setCurrentFotoId] = useState<number | undefined>()
  const [formData, setFormData] = useState<TutorFormData>({
    nome: "",
    telefone: "",
    endereco: "",
  })
  const [cpfDisplay, setCpfDisplay] = useState("")

  useEffect(() => {
    const subLoading = tutoresFacade.isLoading$.subscribe(setLoading)
    const subSaving = tutoresFacade.isSaving$.subscribe(setSaving)
    const subTutor = tutoresFacade.selectedTutor$.subscribe((tutor) => {
      if (tutor && isEditMode) {
        setFormData({
          id: tutor.id,
          nome: tutor.nome,
          telefone: tutor.telefone,
          endereco: tutor.endereco,
          cpf: tutor.cpf,
          fotoUrl: tutor.fotoUrl,
        })
        setCpfDisplay(tutor.cpf ? cpfMask(String(tutor.cpf)) : "")
        setCurrentFotoId(tutor.fotoId)
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
      subTutor.unsubscribe()
      subAuth.unsubscribe()
    }
  }, [isEditMode, cpfMask])

  useEffect(() => {
    if (isAuthReady) {
      if (isEditMode && id) {
        tutoresFacade.getTutorById(id)
      } else {
        tutoresFacade.clearSelectedTutor()
      }
    }
  }, [id, isEditMode, isAuthReady])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    if (name === "telefone") {
      setFormData((prev) => ({ ...prev, telefone: phone(value) }))
    } else if (name === "cpf") {
      const formatted = cpfMask(value)
      setCpfDisplay(formatted)
      const numericValue = formatted.replace(/\D/g, "")
      setFormData((prev) => ({
        ...prev,
        cpf: numericValue ? Number(numericValue) : undefined,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
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
      const savedTutorId = await tutoresFacade.saveTutor(formData)

      if (photoMarkedForDeletion && formData.id && currentFotoId) {
        await tutoresFacade.deletePhoto(formData.id, currentFotoId)
      }

      if (selectedFile && savedTutorId) {
        await tutoresFacade.uploadPhoto(savedTutorId, selectedFile)
      }

      toastStore.success(
        isEditMode ? "Tutor atualizado!" : "Tutor cadastrado!",
        `${formData.nome} foi salvo com sucesso.`,
      )

      navigate("/tutores")
    } catch {
      toastStore.error("Erro ao salvar", "Não foi possível salvar o tutor.")
    }
  }

  const handleDeleteTutor = async () => {
    if (!formData.id) return

    setIsDeleting(true)

    try {
      await tutoresFacade.deleteTutor(formData.id)
      toastStore.success(
        "Tutor removido",
        `${formData.nome} foi removido com sucesso.`,
      )
      navigate("/tutores")
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

      toastStore.error("Erro", "Não foi possível remover o tutor.")
    } finally {
      setIsDeleting(false)
      setShowDeleteTutorModal(false)
    }
  }

  if (loading) {
    return <Spinner variant="blue" size="lg" />
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            to="/tutores"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 mb-6 transition-all duration-200 group hover:gap-3"
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
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    {isEditMode ? "Editar Tutor" : "Cadastrar Novo Tutor"}
                  </h1>
                  <p className="text-gray-600 mt-1 text-lg">
                    {isEditMode
                      ? "Atualize as informações do tutor"
                      : "Preencha os dados para cadastrar um novo tutor"}
                  </p>
                </div>
              </div>
            </div>
            {isEditMode && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Modo Edição
              </span>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 border border-gray-200 overflow-hidden"
        >
          <div className="h-2 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-900" />

          <div className="p-10 space-y-8">
            <div className="flex flex-col items-center gap-4 pb-8 border-b border-gray-100">
              <ImageUpload
                currentImageUrl={formData.fotoUrl}
                onFileSelect={setSelectedFile}
                label="Foto do Tutor"
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
                  Informações do Tutor
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>

              <div className="group">
                <label
                  htmlFor="nome"
                  className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3"
                >
                  <svg
                    className="w-5 h-5 text-blue-500"
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
                  Nome Completo
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Digite o nome completo"
                  required
                  className="w-full px-5 py-4 text-base bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-blue-300 shadow-sm"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="group">
                  <label
                    htmlFor="cpf"
                    className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3"
                  >
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                    CPF
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={cpfDisplay}
                    onChange={handleChange}
                    placeholder="999.999.999-99"
                    maxLength={14}
                    required
                    className="w-full px-5 py-4 text-base bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-blue-300 shadow-sm"
                  />
                </div>

                <div className="group">
                  <label
                    htmlFor="telefone"
                    className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3"
                  >
                    <svg
                      className="w-5 h-5 text-blue-500"
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
                    Telefone
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(99) 99999-9999"
                    maxLength={15}
                    required
                    className="w-full px-5 py-4 text-base bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-blue-300 shadow-sm"
                  />
                </div>

                <div className="group md:col-span-2">
                  <label
                    htmlFor="endereco"
                    className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3"
                  >
                    <svg
                      className="w-5 h-5 text-blue-500"
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
                    Endereço
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    placeholder="Rua, número, bairro, cidade - UF"
                    required
                    rows={3}
                    className="w-full px-5 py-4 text-base bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all duration-300 resize-none placeholder:text-gray-400 hover:border-blue-300 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-8 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-900 hover:from-blue-500 hover:to-blue-900 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-500/50 active:scale-[0.97] shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 overflow-hidden group"
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
                      <span className="relative z-10">Salvar Tutor</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(isEditMode ? `/tutores/${id}` : "/tutores")
                  }
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
                  onClick={() => setShowDeleteTutorModal(true)}
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
                  Remover Tutor
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
          message={`Deseja confirmar as alterações feitas em ${formData.nome}? Esta ação atualizará os dados do tutor.`}
          confirmLabel={saving ? "Salvando..." : "Confirmar e Salvar"}
          cancelLabel="Cancelar"
          isLoading={saving}
          variant="success"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowSaveConfirmModal(false)}
        />

        <ConfirmModal
          isOpen={showDeleteTutorModal}
          title="Remover Tutor"
          message={`Deseja realmente remover "${formData.nome}" permanentemente? Esta ação não pode ser desfeita.`}
          confirmLabel="Remover"
          cancelLabel="Cancelar"
          isLoading={isDeleting}
          variant="danger"
          onConfirm={handleDeleteTutor}
          onCancel={() => setShowDeleteTutorModal(false)}
        />
      </div>
    </div>
  )
}
