// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "./theme.css";
import { PlatformConfigProvider } from "./context/PlatformConfigContext";

// ⚠️ PAS de BrowserRouter ici — il est déjà dans App.jsx
// Mettre BrowserRouter deux fois casse useLocation()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PlatformConfigProvider>
      <App />
    </PlatformConfigProvider>
  </StrictMode>
)
