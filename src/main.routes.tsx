import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './app/shared/layouts/MainLayout';

const HomePage = lazy(() => import('./app/pages/HomePage'));

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <MainLayout>
        <Suspense fallback={null}>
          <HomePage />
        </Suspense>
      </MainLayout>
    ),
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
