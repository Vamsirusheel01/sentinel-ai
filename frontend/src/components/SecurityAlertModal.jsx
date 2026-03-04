import { useEffect } from 'react'

export default function SecurityAlertModal({ alert, onClose }) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Auto-close after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 10000)
    return () => clearTimeout(timer)
  }, [onClose])

  if (!alert) return null

  const getSeverityStyles = (severity) => {
    const styles = {
      critical: {
        border: 'border-red-500',
        bg: 'bg-red-500/10',
        icon: 'text-red-500',
        badge: 'bg-red-500/20 text-red-400 border-red-500/50'
      },
      high: {
        border: 'border-orange-500',
        bg: 'bg-orange-500/10',
        icon: 'text-orange-500',
        badge: 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      },
      medium: {
        border: 'border-yellow-500',
        bg: 'bg-yellow-500/10',
        icon: 'text-yellow-500',
        badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      },
      low: {
        border: 'border-blue-500',
        bg: 'bg-blue-500/10',
        icon: 'text-blue-500',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      }
    }
    return styles[severity?.toLowerCase()] || styles.critical
  }

  const styles = getSeverityStyles(alert.severity)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-lg bg-slate-900 rounded-xl border-2 ${styles.border} shadow-2xl animate-slideDown`}>
        {/* Red pulsing header bar */}
        <div className={`h-2 ${styles.bg} rounded-t-xl relative overflow-hidden`}>
          <div className={`absolute inset-0 ${styles.bg} animate-pulse`} />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            {/* Alert Icon */}
            <div className={`flex-shrink-0 w-14 h-14 rounded-full ${styles.bg} flex items-center justify-center animate-pulse`}>
              <svg className={`w-8 h-8 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">Security Alert</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${styles.badge}`}>
                  {alert.severity}
                </span>
              </div>
              <p className="text-slate-300 font-medium">{alert.event_type || alert.eventType}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Details */}
          <div className={`mt-4 p-4 rounded-lg ${styles.bg} border ${styles.border}/30`}>
            <p className="text-slate-200 mb-3">
              {alert.description || `Threat detected: ${alert.event_type || alert.eventType}`}
            </p>
            
            {(alert.trust_score_before !== undefined && alert.trust_score_after !== undefined) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Trust Score Impact:</span>
                <span className="text-white font-semibold">{alert.trust_score_before?.toFixed(1)}</span>
                <span className="text-slate-500">→</span>
                <span className={`font-semibold ${styles.icon}`}>{alert.trust_score_after?.toFixed(1)}</span>
                <span className={`text-sm ${styles.icon}`}>
                  ({(alert.trust_score_after - alert.trust_score_before).toFixed(1)} points)
                </span>
              </div>
            )}
            
            <div className="mt-2 text-xs text-slate-500">
              {new Date(alert.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition-colors ${
                alert.severity?.toLowerCase() === 'critical' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              Acknowledge
            </button>
            <button
              onClick={() => {
                window.location.href = '/threats'
              }}
              className="flex-1 px-4 py-2.5 border border-slate-600 rounded-lg font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>

        {/* Progress bar for auto-close */}
        <div className="h-1 bg-slate-800 rounded-b-xl overflow-hidden">
          <div 
            className={`h-full ${alert.severity?.toLowerCase() === 'critical' ? 'bg-red-500' : 'bg-orange-500'} animate-shrink`}
            style={{ animationDuration: '10s' }}
          />
        </div>
      </div>
    </div>
  )
}
