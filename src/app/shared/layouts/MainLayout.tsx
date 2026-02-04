import { useEffect, type PropsWithChildren } from "react"
import { Navbar } from "../../core/layouts/Navbar"
import { Footer } from "../../core/layouts/Footer"
import { ToastContainer } from "../components/ToastContainer"
import { toastStore } from "../components/toast.store"
import { petsFacade } from "../../features/pets/facades/pets.facade"
import { tutoresFacade } from "../../features/tutores/facades/tutores.facade"

export default function MainLayout({ children }: PropsWithChildren) {
  useEffect(() => {
    const subPetsError = petsFacade.error$.subscribe((error) => {
      if (error) {
        toastStore.error("Erro em Pets", error)
        petsFacade.clearError()
      }
    })

    const subTutoresError = tutoresFacade.error$.subscribe((error) => {
      if (error) {
        toastStore.error("Erro em Tutores", error)
        tutoresFacade.clearError()
      }
    })

    return () => {
      subPetsError.unsubscribe()
      subTutoresError.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <ToastContainer />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
