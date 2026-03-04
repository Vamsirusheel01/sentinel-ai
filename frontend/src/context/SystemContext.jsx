import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'

const SystemContext = createContext()

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export function SystemProvider({ children }) {
  const [isRunning, setIsRunning] = useState(false)
  const [trustScore, setTrustScore] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)
  const [lastEvent, setLastEvent] = useState(null)
  const [isIsolated, setIsIsolated] = useState(false)
  const [backendConnected, setBackendConnected] = useState(false)
  const [agentConnected, setAgentConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  // Fetch latest system state from backend
  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/system-status`)
      const s = response.data
      if (s.trustScore !== undefined) setTrustScore(s.trustScore)
      if (s.systemStatus !== undefined) setSystemStatus(s.systemStatus)
      if (s.lastEvent !== undefined) setLastEvent(s.lastEvent)
      if (s.isIsolated !== undefined) setIsIsolated(s.isIsolated)
      setBackendConnected(true)
      setError(null)
    } catch (err) {
      setBackendConnected(false)
      setError(err.message || 'Failed to fetch system status')
    }
  }, [])

  // Update system state (for external callers like SecurityContext)
  const updateSystemState = useCallback((data) => {
    if (data.trustScore !== undefined) setTrustScore(data.trustScore)
    if (data.systemStatus !== undefined) setSystemStatus(data.systemStatus)
    if (data.lastEvent !== undefined) setLastEvent(data.lastEvent)
    if (data.isIsolated !== undefined) setIsIsolated(data.isIsolated)
  }, [])

  // Poll backend while running
  useEffect(() => {
    if (!isRunning) {
      clearInterval(pollRef.current)
      pollRef.current = null
      return
    }
    // Immediate fetch, then every 2 seconds
    fetchSystemStatus()
    pollRef.current = setInterval(fetchSystemStatus, 2000)
    return () => clearInterval(pollRef.current)
  }, [isRunning, fetchSystemStatus])

  // Start protection system
  const startProtection = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Launch Electron backend + agent processes
      if (window.api && window.api.startSystem) {
        await window.api.startSystem()
      }
      setIsRunning(true)
      setAgentConnected(true)

      // Verify backend is reachable
      try {
        const response = await axios.get(`${API_BASE_URL}/api/system-status`)
        if (response.status === 200) {
          setBackendConnected(true)
          const s = response.data
          updateSystemState({
            trustScore: s.trustScore,
            systemStatus: s.systemStatus,
            lastEvent: s.lastEvent,
            isIsolated: s.isIsolated,
          })
        }
      } catch {
        setBackendConnected(false)
      }
    } catch (err) {
      setError('Failed to start protection system')
      setAgentConnected(false)
      console.error('Error starting system:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [updateSystemState])

  // Stop protection system — only runs when explicitly triggered
  const stopProtection = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (window.api && window.api.stopSystem) {
        await window.api.stopSystem()
      }
      setIsRunning(false)
      setAgentConnected(false)
      setBackendConnected(false)
    } catch (err) {
      setError('Failed to stop protection system')
      console.error('Error stopping system:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Restore system from isolated state
  const restoreSystem = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.post(`${API_BASE_URL}/api/system/restore`)
      if (response.status === 200) {
        await fetchSystemStatus()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to restore system')
      console.error('Error restoring system:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchSystemStatus])

  // Reset all monitoring data
  const resetMonitoring = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      await axios.post(`${API_BASE_URL}/api/reset-monitoring`)
      await fetchSystemStatus()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset monitoring data')
      console.error('Error resetting monitoring:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchSystemStatus])

  const value = {
    // State
    isRunning,
    trustScore,
    systemStatus,
    lastEvent,
    isIsolated,
    backendConnected,
    agentConnected,
    loading,
    error,
    // Actions
    startProtection,
    stopProtection,
    restoreSystem,
    resetMonitoring,
    updateSystemState,
  }

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
}

export function useSystem() {
  const context = useContext(SystemContext)
  if (!context) {
    throw new Error('useSystem must be used within SystemProvider')
  }
  return context
}
