import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import ProtectionCenter from './pages/ProtectionCenter'
import LiveActivity from './pages/LiveActivity'
import ThreatHistory from './pages/ThreatHistory'
import Logs from './pages/Logs'
import Devices from './pages/Devices'
import Settings from './pages/Settings'
import Support from './pages/Support'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - Requires Authentication */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/protection" element={<ProtectionCenter />} />
          <Route path="/activity" element={<LiveActivity />} />
          <Route path="/threats" element={<ThreatHistory />} />
          <Route path="/devices" element={<Devices />} />
          
          {/* Admin Only Routes */}
          <Route
            path="/logs"
            element={
              <ProtectedRoute roles={['admin']}>
                <Logs />
              </ProtectedRoute>
            }
          />
          
          <Route path="/settings" element={<Settings />} />
          <Route path="/support" element={<Support />} />
        </Route>

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
