

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SecurityProvider } from './context/SecurityContext';
import { SystemProvider } from './context/SystemContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';
// Enable dark mode for the entire app
document.documentElement.classList.add('dark')

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'white', background: '#1e293b', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <React.StrictMode>
      <AuthProvider>
        <SystemProvider>
          <SecurityProvider>
            <App />
          </SecurityProvider>
        </SystemProvider>
      </AuthProvider>
    </React.StrictMode>
  </ErrorBoundary>
)

