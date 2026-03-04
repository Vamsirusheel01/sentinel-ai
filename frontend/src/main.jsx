import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { SecurityProvider } from './context/SecurityContext'
import { SystemProvider } from './context/SystemContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Enable dark mode for the entire app
document.documentElement.classList.add('dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SystemProvider>
        <SecurityProvider>
          <App />
        </SecurityProvider>
      </SystemProvider>
    </AuthProvider>
  </React.StrictMode>,
)

