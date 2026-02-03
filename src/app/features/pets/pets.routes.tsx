import { Route, Routes } from "react-router-dom"
import { PetsListPage } from "./pages/PetsListPage"

export function PetsRoutes() {
  return (
    <Routes>
      <Route index element={<PetsListPage />} />

    </Routes>
  )
}
