export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <span>🐾</span>© {new Date().getFullYear()} Éder Lemes
          </p>
          <p className="text-xs text-gray-400">
            Governo do Estado de Mato Grosso
          </p>
        </div>
      </div>
    </footer>
  )
}