// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './AuthContext'
import ErrorBoundary from './components/ErrorBoundary' // 👈 Import it

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary> {/* 👈 Wrap everything */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)