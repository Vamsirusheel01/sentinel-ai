import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const location = useLocation()

  const navigation = [
    { name: 'Home', path: '/', icon: 'M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0' },
    { name: 'Protection Center', path: '/protection', icon: 'M12 1l9.5 5.5v11c0 5.52-4.48 10-9.5 10S2.5 22.5 2.5 17.5v-11L12 1m3 12h-6' },
    { name: 'Live Activity', path: '/activity', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Threat History', path: '/threats', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
    { name: 'Logs (Admin)', path: '/logs', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { name: 'Settings', path: '/settings', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.62l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.48.1.62l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.62l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.48-.12-.62l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
    { name: 'Support', path: '/support', icon: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-r border-slate-700 transition-all duration-300 flex flex-col shadow-2xl z-40`}
    >
      {/* Logo & Header */}
      <div className="px-6 py-8 border-b border-slate-700/50">
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          {/* Sentinel Logo */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          </div>
          {isOpen && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                Sentinel
              </h1>
              <p className="text-xs text-slate-400">Enterprise</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
            title={isOpen ? '' : item.name}
          >
            <svg
              className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                isActive(item.path) ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {isOpen && <span className="text-sm font-medium">{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-all duration-200 group"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {isOpen && <span className="ml-2 text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
