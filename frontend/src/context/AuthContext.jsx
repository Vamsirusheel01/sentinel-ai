import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getUsers, addUser as addUserToStorage, findUser } from '../utils/authStorage'

const AuthContext = createContext()

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin',
  role: 'admin'
}

// LocalStorage key for tokens
const AUTH_TOKEN_KEY = 'sentinel_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY)
        if (token) {
          // Parse token to get user info
          const userData = JSON.parse(atob(token.split('.')[1]))
          setUser(userData.username)
          setRole(userData.role)
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        localStorage.removeItem(AUTH_TOKEN_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = useCallback((username, password) => {
    return new Promise((resolve, reject) => {
      try {
        setError(null)

        // Check admin credentials first
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
          const token = generateToken(username, ADMIN_CREDENTIALS.role)
          localStorage.setItem(AUTH_TOKEN_KEY, token)
          setUser(username)
          setRole(ADMIN_CREDENTIALS.role)
          setIsAuthenticated(true)
          resolve({ success: true, user: username, role: ADMIN_CREDENTIALS.role })
          return
        }

        // Check localStorage users using storage utility
        const foundUser = findUser(username, password)

        if (foundUser) {
          const token = generateToken(username, foundUser.role)
          localStorage.setItem(AUTH_TOKEN_KEY, token)
          setUser(username)
          setRole(foundUser.role)
          setIsAuthenticated(true)
          resolve({ success: true, user: username, role: foundUser.role })
        } else {
          const errorMsg = 'Invalid username or password'
          setError(errorMsg)
          reject(new Error(errorMsg))
        }
      } catch (err) {
        const errorMsg = err.message || 'Login failed'
        setError(errorMsg)
        reject(err)
      }
    })
  }, [])

  // Logout function
  const logout = useCallback(() => {
    return new Promise((resolve) => {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setUser(null)
        setRole(null)
        setIsAuthenticated(false)
        setError(null)
        resolve({ success: true })
      } catch (err) {
        console.error('Logout error:', err)
        // Force logout anyway
        setUser(null)
        setRole(null)
        setIsAuthenticated(false)
        resolve({ success: true })
      }
    })
  }, [])

  // Register function
  const register = useCallback((username, password) => {
    return new Promise((resolve, reject) => {
      try {
        setError(null)

        // Validate input
        if (!username || !password) {
          const errorMsg = 'Username and password are required'
          setError(errorMsg)
          reject(new Error(errorMsg))
          return
        }

        if (username.length < 3) {
          const errorMsg = 'Username must be at least 3 characters'
          setError(errorMsg)
          reject(new Error(errorMsg))
          return
        }

        if (password.length < 4) {
          const errorMsg = 'Password must be at least 4 characters'
          setError(errorMsg)
          reject(new Error(errorMsg))
          return
        }

        // Check if username is admin
        if (username === ADMIN_CREDENTIALS.username) {
          const errorMsg = 'This username is already taken'
          setError(errorMsg)
          reject(new Error(errorMsg))
          return
        }

        // Use storage utility to add user
        const newUser = addUserToStorage(username, password)

        if (newUser) {
          // Automatically log in the new user
          const token = generateToken(username, 'user')
          localStorage.setItem(AUTH_TOKEN_KEY, token)
          setUser(username)
          setRole('user')
          setIsAuthenticated(true)

          resolve({ success: true, user: username, role: 'user' })
        } else {
          const errorMsg = 'Registration failed'
          setError(errorMsg)
          reject(new Error(errorMsg))
        }
      } catch (err) {
        const errorMsg = err.message || 'Registration failed'
        setError(errorMsg)
        reject(err)
      }
    })
  }, [])

  // Helper function to generate a simple JWT-like token
  const generateToken = (username, userRole) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      username,
      role: userRole,
      iat: Math.floor(Date.now() / 1000)
    }))
    const signature = btoa('sentinel-secret')
    return `${header}.${payload}.${signature}`
  }

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return role === 'admin'
  }, [role])

  // Check if user has specific role
  const hasRole = useCallback((requiredRole) => {
    return role === requiredRole
  }, [role])

  const value = {
    // State
    user,
    role,
    isAuthenticated,
    isLoading,
    error,

    // Methods
    login,
    logout,
    register,

    // Helpers
    isAdmin,
    hasRole,

    // Clear error
    clearError: () => setError(null)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
