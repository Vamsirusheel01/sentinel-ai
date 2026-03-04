import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // Validate password strength
      if (password.length < 4) {
        throw new Error('Password must be at least 4 characters')
      }

      // Validate username length
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters')
      }

      // Call register from AuthContext
      await register(username, password)

      // Show success message
      setSuccess(true)

      // Clear form
      setUsername('')
      setPassword('')
      setConfirmPassword('')

      // Redirect to home after success
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl opacity-20"></div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">
            Sentinel AI
          </h1>
          <p className="text-slate-400 mt-2">Enterprise Security Platform</p>
        </div>

        {/* Register Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Create Account</h2>
            <p className="text-slate-400 text-sm mb-6">
              Sign up to get started with Sentinel AI
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username (min 3 characters)"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  {username.length}/3 characters minimum
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 4 characters)"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  {password.length}/4 characters minimum
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-2.5 rounded-lg bg-slate-700 border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-600 focus:border-cyan-500 focus:ring-cyan-500'
                  }`}
                  disabled={isLoading}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">
                    ✗ Passwords do not match
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-emerald-400 mt-1">
                    ✓ Passwords match
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-sm text-emerald-300">
                    ✓ Account created successfully! Redirecting...
                  </p>
                </div>
              )}

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2.5 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Creating account...</span>
                  </span>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            {/* Password Requirements */}
            <div className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <p className="text-xs font-medium text-slate-300 mb-2">Password Requirements:</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li className={password.length >= 4 ? 'text-emerald-400' : ''}>
                  {password.length >= 4 ? '✓' : '○'} At least 4 characters
                </li>
                <li className={username.length >= 3 ? 'text-emerald-400' : ''}>
                  {username.length >= 3 ? '✓' : '○'} Username at least 3 characters
                </li>
                <li className={password === confirmPassword && confirmPassword ? 'text-emerald-400' : ''}>
                  {password === confirmPassword && confirmPassword ? '✓' : '○'} Passwords match
                </li>
              </ul>
            </div>

            {/* Back to Login */}
            <div className="mt-6 text-center text-slate-400 text-sm">
              <p>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Version Info */}
          <div className="bg-slate-900/50 border-t border-slate-700 px-8 py-3 text-center">
            <p className="text-xs text-slate-500">
              Sentinel AI Enterprise v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
