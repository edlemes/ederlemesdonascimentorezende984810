import { Route, Routes } from "react-router-dom"
import { TutoresListPage } from "./pages/TutoresListPage"
import { TutorDetailPage } from "./pages/TutorDetailPage"
import { TutorFormPage } from "./pages/TutorFormPage"
import { LinkPetPage } from "./pages/LinkPetPage"

export function TutoresRoutes() {
  return (
    <Routes>
      <Route index element={<TutoresListPage />} />
      <Route path="novo" element={<TutorFormPage />} />
      <Route path=":id" element={<TutorDetailPage />} />
      <Route path=":id/vincular" element={<LinkPetPage />} />
      <Route path=":id/editar" element={<TutorFormPage />} />
    </Routes>
  )
}
