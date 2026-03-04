import { useState, useEffect, useRef } from 'react'
import DeviceDetailModal from '../components/DeviceDetailModal'

const STATUS_STYLES = {
  protected:  { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-700', dot: 'bg-emerald-400' },
  warning:    { bg: 'bg-yellow-900/40',  text: 'text-yellow-300',  border: 'border-yellow-700',  dot: 'bg-yellow-400' },
  suspicious: { bg: 'bg-orange-900/40',  text: 'text-orange-300',  border: 'border-orange-700',  dot: 'bg-orange-400' },
  'at risk':  { bg: 'bg-orange-900/40',  text: 'text-orange-300',  border: 'border-orange-700',  dot: 'bg-orange-400' },
  critical:   { bg: 'bg-red-900/40',     text: 'text-red-300',     border: 'border-red-700',     dot: 'bg-red-400' },
  isolated:   { bg: 'bg-red-950/50',     text: 'text-red-400',     border: 'border-red-900',     dot: 'bg-red-600' },
}

const DEFAULT_STYLE = { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600', dot: 'bg-slate-500' }

function getStatusStyle(status) {
  return STATUS_STYLES[status?.toLowerCase()] || DEFAULT_STYLE
}

function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function formatLastSeen(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now - d
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString()
}

export default function Devices() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const intervalRef = useRef(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/devices`)
        if (!res.ok) throw new Error('Failed to fetch devices')
        const data = await res.json()
        setDevices(data.devices || [])
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
    intervalRef.current = setInterval(fetchDevices, 5000)
    return () => clearInterval(intervalRef.current)
  }, [API_BASE_URL])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-100 mb-2">Devices</h1>
        <p className="text-slate-400">Connected endpoints and their security posture</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Devices</p>
          <p className="text-3xl font-bold text-slate-100">{devices.length}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Protected</p>
          <p className="text-3xl font-bold text-emerald-400">
            {devices.filter(d => d.status?.toLowerCase() === 'protected').length}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">At Risk</p>
          <p className="text-3xl font-bold text-red-400">
            {devices.filter(d => ['critical', 'at risk', 'isolated', 'suspicious', 'warning'].includes(d.status?.toLowerCase())).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-slate-900/60 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Hostname</span>
          <span>Operating System</span>
          <span>Trust Score</span>
          <span>Status</span>
          <span>Last Seen</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-slate-400 text-sm">Loading devices...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="px-6 py-12 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && devices.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No devices connected</p>
            </div>
          </div>
        )}

        {/* Rows */}
        {!loading && !error && devices.map((device, idx) => {
          const style = getStatusStyle(device.status)
          return (
            <div
              key={device.device_id || idx}
              onClick={() => setSelectedDeviceId(device.device_id)}
              className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
            >
              {/* Hostname */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{device.hostname || 'Unknown'}</p>
                  <p className="text-xs text-slate-500 font-mono">{device.device_id?.slice(0, 12) || '—'}</p>
                </div>
              </div>

              {/* OS */}
              <div className="flex items-center">
                <p className="text-sm text-slate-300">{device.os || 'Unknown'}</p>
              </div>

              {/* Trust Score */}
              <div className="flex items-center">
                <span className={`text-lg font-bold ${getScoreColor(device.trust_score ?? 0)}`}>
                  {device.trust_score ?? '—'}
                </span>
                <span className="text-xs text-slate-500 ml-1">/100</span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center">
                <span className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                  <span>{device.status || 'Unknown'}</span>
                </span>
              </div>

              {/* Last Seen */}
              <div className="flex items-center">
                <p className="text-sm text-slate-400">{formatLastSeen(device.last_seen)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Device Detail Modal */}
      {selectedDeviceId && (
        <DeviceDetailModal
          deviceId={selectedDeviceId}
          onClose={() => setSelectedDeviceId(null)}
        />
      )}
    </div>
  )
}
