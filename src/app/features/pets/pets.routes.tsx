import { Route, Routes } from "react-router-dom"
import { PetsListPage } from "./pages/PetsListPage"
import { PetDetailPage } from "./pages/PetDetailPage"
import { PetFormPage } from "./pages/PetFormPage"

export function PetsRoutes() {
  return (
    <Routes>
      <Route index element={<PetsListPage />} />
      <Route path=":id" element={<PetDetailPage />} />
      <Route path="novo" element={<PetFormPage />} />
      <Route path=":id/editar" element={<PetFormPage />} />
    </Routes>
  )
}
