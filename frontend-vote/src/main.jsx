// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "./theme.css";
import { PlatformConfigProvider } from "./context/PlatformConfigContext";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PlatformConfigProvider>
      <App />
    </PlatformConfigProvider>
  </StrictMode>
)
