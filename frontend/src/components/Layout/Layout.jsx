import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SecurityAlertModal from '../SecurityAlertModal'
import { useSecurity } from '../../context/SecurityContext'

export default function Layout() {
  const { alert, dismissAlert } = useSecurity()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Security Alert Modal */}
      {alert && (
        <SecurityAlertModal alert={alert} onClose={dismissAlert} />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Topbar */}
      <Topbar />

      {/* Main Content Area */}
      <main className="ml-64 mt-28 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Page Content */}
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
