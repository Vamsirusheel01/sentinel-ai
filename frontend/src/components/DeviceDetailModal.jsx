import { useState, useEffect } from 'react'

const SEVERITY_COLORS = {
  critical: 'bg-red-900/40 text-red-300 border-red-700',
  high:     'bg-orange-900/40 text-orange-300 border-orange-700',
  medium:   'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  low:      'bg-blue-900/40 text-blue-300 border-blue-700',
}

function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function getScoreBarColor(score) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export default function DeviceDetailModal({ deviceId, onClose }) {
  const [device, setDevice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  useEffect(() => {
    if (!deviceId) return
    const fetchDetail = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE_URL}/api/devices/${encodeURIComponent(deviceId)}`)
        if (!res.ok) throw new Error('Device not found')
        const data = await res.json()
        setDevice(data.device)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [deviceId, API_BASE_URL])

  if (!deviceId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Panel */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Device Details</h2>
              <p className="text-xs text-slate-500 font-mono">{deviceId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
              <span className="text-slate-400 text-sm">Loading device info...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && device && (
            <>
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Hostname" value={device.hostname || 'Unknown'} />
                <InfoCard label="OS Version" value={`${device.os || 'Unknown'} ${device.os_version || ''}`} />
                <InfoCard label="Architecture" value={device.architecture || 'Unknown'} />
                <InfoCard label="Status" value={device.status || 'Unknown'} />
              </div>

              {/* Trust Score */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Trust Score</p>
                  <span className={`text-2xl font-bold ${getScoreColor(device.trust_score ?? 0)}`}>
                    {device.trust_score ?? '—'}<span className="text-xs text-slate-500 ml-1">/100</span>
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(device.trust_score ?? 0)}`}
                    style={{ width: `${device.trust_score ?? 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Last Activity */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Last Activity</p>
                <p className="text-sm text-slate-300">{formatTime(device.last_seen)}</p>
              </div>

              {/* Recent Alerts */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Recent Alerts</p>
                {(!device.recent_alerts || device.recent_alerts.length === 0) ? (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-900/40 border border-emerald-700 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-slate-500 text-sm">No recent alerts</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {device.recent_alerts.map((alert, idx) => {
                      const sevClass = SEVERITY_COLORS[alert.severity?.toLowerCase()] || 'bg-slate-800 text-slate-300 border-slate-700'
                      return (
                        <div key={idx} className={`border rounded-md px-4 py-3 ${sevClass}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase">{alert.severity}</span>
                            <span className="text-xs opacity-70">{formatTime(alert.timestamp)}</span>
                          </div>
                          <p className="text-sm font-medium">{alert.event_type?.replaceAll('_', ' ')}</p>
                          {alert.process_name && alert.process_name !== 'unknown' && (
                            <p className="text-xs opacity-70 font-mono mt-0.5">{alert.process_name}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-2 px-5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className="text-sm text-slate-200 font-medium">{value}</p>
    </div>
  )
}
