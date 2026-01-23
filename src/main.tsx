import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./assets/styles/tailwind.css";
import AppRoutes from './main.routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>,
)
