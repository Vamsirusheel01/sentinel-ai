import { useState, useEffect, useRef } from 'react'

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-900/40', border: 'border-red-700', badge: 'bg-red-600 text-red-100', dot: 'bg-red-500' },
  high:     { bg: 'bg-orange-900/30', border: 'border-orange-700', badge: 'bg-orange-600 text-orange-100', dot: 'bg-orange-500' },
  medium:   { bg: 'bg-yellow-900/30', border: 'border-yellow-700', badge: 'bg-yellow-600 text-yellow-100', dot: 'bg-yellow-500' },
  low:      { bg: 'bg-blue-900/30', border: 'border-blue-700', badge: 'bg-blue-600 text-blue-100', dot: 'bg-blue-500' },
}

const DEFAULT_STYLE = { bg: 'bg-slate-800', border: 'border-slate-700', badge: 'bg-slate-600 text-slate-200', dot: 'bg-slate-500' }

export default function AlertFeed() {
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState(false)
  const intervalRef = useRef(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        // Newest first, limit to 10
        const sorted = (data.alerts || [])
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10)
        setAlerts(sorted)
        setError(false)
      } catch {
        setError(true)
      }
    }

    fetchAlerts()
    intervalRef.current = setInterval(fetchAlerts, 2000)
    return () => clearInterval(intervalRef.current)
  }, [API_BASE_URL])

  const getStyle = (severity) => SEVERITY_STYLES[severity?.toLowerCase()] || DEFAULT_STYLE

  const formatTime = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Alert Feed
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`}></div>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      {alerts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">No security alerts detected.</p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center py-6">Unable to fetch alerts</p>
      )}

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {alerts.map((alert, idx) => {
          const style = getStyle(alert.severity)
          return (
            <div
              key={`${alert.timestamp}-${idx}`}
              className={`${style.bg} border ${style.border} rounded-md px-4 py-3 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`${style.badge} text-xs font-bold uppercase px-2 py-0.5 rounded`}>
                  {alert.severity}
                </span>
                <span className="text-xs text-slate-500">{formatTime(alert.timestamp)}</span>
              </div>
              <p className="text-sm font-medium text-slate-200 mt-1">
                {alert.event_type?.replaceAll('_', ' ')}
              </p>
              {alert.process_name && alert.process_name !== 'unknown' && (
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{alert.process_name}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
