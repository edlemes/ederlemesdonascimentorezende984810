import { Suspense, lazy } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import MainLayout from "./app/shared/layouts/MainLayout"

const PetsRoutes = lazy(() =>
  import("./app/features/pets/pets.routes").then((m) => ({
    default: m.PetsRoutes,
  })),
)

const TutoresRoutes = lazy(() =>
  import("./app/features/tutores/tutores.routes").then((m) => ({
    default: m.TutoresRoutes,
  })),
)

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: "/*",
    element: (
      <MainLayout>
        <Suspense fallback={<LoadingFallback />}>
          <PetsRoutes />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: "/tutores/*",
    element: (
      <MainLayout>
        <Suspense fallback={<LoadingFallback />}>
          <TutoresRoutes />
        </Suspense>
      </MainLayout>
    ),
  },
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
