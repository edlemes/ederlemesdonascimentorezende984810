import { Route, Routes } from "react-router-dom"
import { PetsListPage } from "./pages/PetsListPage"
import { PetDetailPage } from "./pages/PetDetailPage"
import { PetFormPage } from "./pages/PetFormPage"
import { LinkTutorPage } from "./pages/LinkTutorPage"

export function PetsRoutes() {
  return (
    <Routes>
      <Route index element={<PetsListPage />} />
      <Route path="novo" element={<PetFormPage />} />
      <Route path=":id" element={<PetDetailPage />} />
      <Route path=":id/editar" element={<PetFormPage />} />
      <Route path=":id/vincular-tutor" element={<LinkTutorPage />} />
    </Routes>
  )
}
