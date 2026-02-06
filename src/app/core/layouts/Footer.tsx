export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 flex items-center gap-2">
            © {new Date().getFullYear()} Éder Lemes
          </p>
          <p className="text-xs text-gray-400">
            SEPLAG - Governo do Estado de Mato Grosso
          </p>
        </div>
      </div>
    </footer>
  )
}