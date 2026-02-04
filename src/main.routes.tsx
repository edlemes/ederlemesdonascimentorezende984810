import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './app/shared/layouts/MainLayout';

const PetsRoutes = lazy(() =>
  import("./app/features/pets/pets.routes").then((m) => ({
    default: m.PetsRoutes,
  })),
)

const router = createBrowserRouter([
  {
    path: '/*',
    element: (
      <MainLayout>
        <Suspense fallback={null}>
          <PetsRoutes />
        </Suspense>
      </MainLayout>
    ),
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
