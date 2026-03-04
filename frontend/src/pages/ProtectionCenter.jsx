import { useSecurity } from '../context/SecurityContext'
import { useSystem } from '../context/SystemContext'
import TrustScoreChart from '../components/TrustScoreChart'
import AlertFeed from '../components/AlertFeed'
import { useState, useEffect, useRef } from 'react'

const API_BASE_URL = 'http://127.0.0.1:5000'
const LOCAL_STORAGE_KEY = 'sentinel_protection'

export default function ProtectionCenter() {
  const { alert, dismissAlert } = useSecurity()
  const {
    trustScore, systemStatus, lastEvent, isIsolated,
    resetMonitoring,
  } = useSystem()

  // State for protection, backend, agent
  const [protectionRunning, setProtectionRunning] = useState(false)
  const [backendRunning, setBackendRunning] = useState(false)
  const [agentConnected, setAgentConnected] = useState(false)
  const [localTrustScore, setLocalTrustScore] = useState(100)
  const [localSystemStatus, setLocalSystemStatus] = useState('Protected')
  const [localAlerts, setLocalAlerts] = useState([])
  const [localHistory, setLocalHistory] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const pollingRef = useRef(null)

  // On page load, recover state from localStorage and backend
  useEffect(() => {
    const state = localStorage.getItem(LOCAL_STORAGE_KEY)
    fetch(`${API_BASE_URL}/api/system-status`)
      .then(res => res.json())
      .then(data => {
        setProtectionRunning(data.protection_active)
        setBackendRunning(data.backend_running)
        setAgentConnected(data.agent_connected)
        setLocalTrustScore(data.trustScore ?? 100)
        setLocalSystemStatus(data.systemStatus ?? 'Protected')
        if (data.protection_active) {
          localStorage.setItem(LOCAL_STORAGE_KEY, 'running')
          startPolling()
        } else {
          localStorage.setItem(LOCAL_STORAGE_KEY, 'stopped')
          stopPolling()
        }
      })
    if (state === 'running') {
      setProtectionRunning(true)
      startPolling()
    } else {
      setProtectionRunning(false)
      stopPolling()
    }
    return () => stopPolling()
  }, [])

  // Start/Stop button handlers
  const startProtection = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/start-protection`, { method: 'POST' })
      if (!res.ok) {
        throw new Error(`Failed to start protection: ${res.status}`)
      }
      setProtectionRunning(true)
      localStorage.setItem(LOCAL_STORAGE_KEY, 'running')
      setLocalTrustScore(100)
      setLocalSystemStatus('Protected')
      setLocalAlerts([])
      setLocalHistory([])
      setBackendRunning(true)
      setAgentConnected(true)
      setErrorMsg('')
      startPolling()
    } catch (err) {
      setErrorMsg("Failed to start protection. Please check backend connectivity and try again.")
    }
  }

  const stopProtection = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/stop-protection`, { method: 'POST' })
      setProtectionRunning(false)
      localStorage.setItem(LOCAL_STORAGE_KEY, 'stopped')
      setBackendRunning(false)
      setAgentConnected(false)
      stopPolling()
    } catch (err) {}
  }

  // Polling logic
  const fetchDashboardData = async () => {
    try {
      const statusRes = await fetch(`${API_BASE_URL}/api/system-status`)
      const statusData = await statusRes.json()
      setLocalTrustScore(statusData.trustScore ?? 100)
      setLocalSystemStatus(statusData.systemStatus ?? 'Protected')
      setBackendRunning(statusData.backend_running)
      setAgentConnected(statusData.agent_connected)
      setProtectionRunning(statusData.protection_active)
      const alertsRes = await fetch(`${API_BASE_URL}/api/alerts`)
      const alertsData = await alertsRes.json()
      setLocalAlerts(alertsData.alerts ?? [])
      const historyRes = await fetch(`${API_BASE_URL}/api/trust-history`)
      const historyData = await historyRes.json()
      setLocalHistory(historyData.history ?? [])
    } catch (err) {}
  }

  const startPolling = () => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(fetchDashboardData, 2000)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // Trust Score Gauge color
  const getScoreColor = () => {
    if (localTrustScore >= 80) return '#10b981' // green
    if (localTrustScore >= 60) return '#eab308' // yellow
    if (localTrustScore >= 40) return '#f97316' // orange
    return '#ef4444' // red
  }

  // Status text under gauge
  const getStatusText = () => {
    if (localTrustScore >= 80) return 'Protected'
    if (localTrustScore >= 60) return 'Warning'
    if (localTrustScore >= 40) return 'Suspicious'
    return 'Critical'
  }

  // Indicator color logic
  const backendColor = backendRunning && protectionRunning ? '#10b981' : '#ef4444'
  const agentColor = agentConnected && protectionRunning ? '#10b981' : '#ef4444'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', background: '#1e293b', minHeight: '100vh', padding: 0 }}>
      {/* Top Status Cards */}
      <div style={{ display: 'flex', gap: 16, margin: '24px 0', padding: '0 24px' }}>
        <div style={{ flex: 1, background: '#232e3c', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Protection</span>
          <span style={{ color: protectionRunning ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: 18 }}>{protectionRunning ? 'Running' : 'Stopped'}</span>
          <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
            <span style={{ color: backendColor, fontSize: 13 }}>● Backend</span>
            <span style={{ color: agentColor, fontSize: 13 }}>● Agent</span>
          </div>
          {/* Start/Stop Button */}
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            {protectionRunning ? (
              <button onClick={stopProtection} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Stop</button>
            ) : (
              <button onClick={startProtection} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Start</button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, background: '#232e3c', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>System Status</span>
          <span style={{ color: getScoreColor(), fontWeight: 600, fontSize: 18 }}>{localSystemStatus}</span>
        </div>
        <div style={{ flex: 1, background: '#232e3c', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Last Update</span>
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>Just now</span>
        </div>
        <div style={{ flex: 1, background: '#232e3c', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
          <button onClick={resetMonitoring} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 500, cursor: 'pointer' }}>Reset Monitoring Data</button>
        </div>
      </div>
      {errorMsg && (
        <div style={{ color: '#ef4444', background: '#232e3c', borderRadius: 8, padding: 8, margin: '0 24px 12px 24px', fontWeight: 500 }}>{errorMsg}</div>
      )}

      {/* Main Dashboard Two-Column Layout */}
      <div style={{ display: 'flex', gap: 24, padding: '0 24px' }}>
        {/* Left Panel: Gauge + Timeline */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Trust Score Gauge */}
          <div style={{ background: '#232e3c', borderRadius: 12, padding: 32, minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, color: '#fff', fontWeight: 600, marginBottom: 12 }}>Trust Score</span>
            <div style={{ position: 'relative', width: 180, height: 180, marginBottom: 12 }}>
              <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#1e293b" strokeWidth="12" />
                <circle
                  cx="100" cy="100" r="90" fill="none"
                  stroke={getScoreColor()} strokeWidth="12"
                  strokeDasharray={`${((localTrustScore) / 100) * 565.48} 565.48`}
                  strokeLinecap="round" transform="rotate(-90 100 100)"
                />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: getScoreColor() }}>{localTrustScore}</span>
                <span style={{ color: '#94a3b8', fontSize: 18 }}>/ 100</span>
              </div>
            </div>
            <span style={{ color: getScoreColor(), fontWeight: 600, fontSize: 22 }}>{getStatusText()}</span>
          </div>
          {/* Trust Score Timeline Chart */}
          <div style={{ background: '#232e3c', borderRadius: 12, padding: 24, minHeight: 320 }}>
            <TrustScoreChart history={localHistory} />
          </div>
        </div>
        {/* Right Panel: Live Security Alerts */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#232e3c', borderRadius: 12, padding: 24, minHeight: 660, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, color: '#fff', fontWeight: 600, marginBottom: 8 }}>Live Security Alerts</span>
            <span style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>Real-time threat detection feed</span>
            <AlertFeed alerts={localAlerts} />
          </div>
        </div>
      </div>
    </div>
  )
}
