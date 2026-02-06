import { useRef, useState } from "react"

interface ImageUploadProps {
  currentImageUrl?: string
  onFileSelect: (file: File | null) => void
  label?: string
  shape?: "circle" | "square"
}

export function ImageUpload({
  currentImageUrl,
  onFileSelect,
  label = "Foto",
  shape = "circle",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const derivedPreview = localPreview ?? currentImageUrl ?? null

  const hasImage = !!derivedPreview

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLocalPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      onFileSelect(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0] || null
    handleFileChange(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const shapeClasses = shape === "circle" ? "rounded-full" : "rounded-2xl"
  const sizeClasses = shape === "circle" ? "w-32 h-32" : "w-full h-48"

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 text-center">
        {label}
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        aria-label="Área de upload de imagem. Clique ou arraste uma imagem"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            inputRef.current?.click()
          }
        }}
        className={`
          relative ${sizeClasses} ${shapeClasses} cursor-pointer
          border-2 border-dashed transition-all duration-200
          flex items-center justify-center overflow-hidden
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"}
          ${hasImage ? "border-transparent" : ""}
        `}
      >
        {hasImage ? (
          <>
            <img
              src={derivedPreview}
              alt="Preview"
              className={`w-full h-full object-cover ${shapeClasses}`}
            />
            <div
              className={`absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors ${shapeClasses} flex items-center justify-center group`}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    inputRef.current?.click()
                  }}
                  className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors cursor-pointer"
                  title="Alterar foto"
                  aria-label="Alterar foto"
                >
                  <svg
                    className="w-4 h-4 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <svg
              className="w-8 h-8 text-gray-400 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">Clique ou arraste</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          aria-label="Selecionar arquivo de imagem"
        />
      </div>
    </div>
  )
}
