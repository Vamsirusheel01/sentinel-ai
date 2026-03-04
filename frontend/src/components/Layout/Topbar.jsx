import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

export default function Topbar() {
  const { user, role, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return '??'
    const parts = user.split(' ')
    if (parts.length === 1) {
      return user.substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // Call backend logout endpoint if needed
      await axios.post(`${API_BASE_URL}/api/logout`, {}, {
        withCredentials: true
      }).catch(() => {
        // Ignore if endpoint doesn't exist, just proceed with logout
      })
      
      // Use auth logout
      await logout()
      
      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout anyway
      await logout()
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getRoleBadgeColor = () => {
    return role === 'admin' 
      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
  }

  const getRoleLabel = () => {
    if (!role) return 'User'
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <header className="ml-64 fixed top-0 right-0 left-64 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border-b border-slate-700 px-8 py-4 shadow-lg z-30">
      <div className="flex items-center justify-between h-16">
        {/* Left Section - Page Title */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Dashboard</h2>
          <p className="text-sm text-slate-400">Welcome back</p>
        </div>

        {/* Right Section - User Info & Actions */}
        <div className="flex items-center space-x-6">
          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-all duration-200 group">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-700"></div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
                {getInitials()}
              </div>

              {/* User Info */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-100">{user || 'User'}</p>
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${getRoleBadgeColor()}`}>
                  {getRoleLabel()}
                </span>
              </div>

              {/* Dropdown Icon */}
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                  <p className="text-sm font-semibold text-slate-100">{user || 'User'}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {role === 'admin' ? 'Full system access' : 'Limited access'}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      // Navigate to profile
                      setShowUserMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to settings
                      setShowUserMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="border-t border-slate-700 py-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
