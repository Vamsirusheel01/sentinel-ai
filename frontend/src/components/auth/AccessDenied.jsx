import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AccessDenied() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 -4v2m0 0H9m3 0h3m-6-4h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6a2 2 0 012-2z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-white mb-2">Access Denied</h1>

        {/* Message */}
        <p className="text-slate-300 mb-6">
          You don't have permission to access this resource.
          {user && <span> User: <strong>{user}</strong></span>}
        </p>

        {/* Description */}
        <p className="text-slate-400 text-sm mb-8">
          If you believe this is an error, please contact your administrator for assistance.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition duration-200"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
