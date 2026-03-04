import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const SecurityContext = createContext()

export function SecurityProvider({ children }) {
  const [trustScore, setTrustScore] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)
  const [lastEvent, setLastEvent] = useState(null)
  const [isIsolated, setIsIsolated] = useState(false)
  const [alert, setAlert] = useState(null)
  const [alertQueue, setAlertQueue] = useState([])
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  
  // Track the last known threat timestamp to detect new threats
  const lastThreatTimestamp = useRef(null)
  const isFirstLoad = useRef(true)

  // Alert cooldown: tracks when each event_type last triggered an alert
  // If the same event_type fires again within 30s, skip the alert
  const alertCooldowns = useRef({})
  const ALERT_COOLDOWN_MS = 30000

  // Show alert popup
  const showAlert = useCallback((alertData) => {
    const now = Date.now()
    const eventType = alertData.event_type
    const lastFired = alertCooldowns.current[eventType]

    // Skip if same event_type fired within 30 seconds
    if (lastFired && (now - lastFired) < ALERT_COOLDOWN_MS) {
      return
    }

    alertCooldowns.current[eventType] = now
    setAlertQueue(prev => [...prev, alertData])
  }, [])

  // Dismiss current alert
  const dismissAlert = useCallback(() => {
    setAlert(null)
  }, [])

  // Process alert queue - show one alert at a time
  useEffect(() => {
    if (!alert && alertQueue.length > 0) {
      setAlert(alertQueue[0])
      setAlertQueue(prev => prev.slice(1))
    }
  }, [alert, alertQueue])

  // Fetch system status from backend on mount and poll every 5 seconds
  // NOTE: Primary system state polling is handled by SystemContext.
  //       This poll supplements for alert-related state only.
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/system-status`)
        if (!response.ok) return
        
        const data = await response.json()
        
        // Only update security-related context state
        if (data.lastEvent !== undefined) {
          setLastEvent(data.lastEvent)
        }
        if (data.isIsolated !== undefined) {
          setIsIsolated(data.isIsolated)
        }
      } catch (err) {
        console.error('Failed to fetch system status:', err)
      }
    }
    
    // Initial fetch
    fetchSystemStatus()
    
    // Poll every 5 seconds to stay in sync with backend
    const interval = setInterval(fetchSystemStatus, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Update all system state from backend
  const updateSystemState = useCallback((data) => {
    if (data.trustScore !== undefined) {
      setTrustScore(data.trustScore)
    }
    if (data.systemStatus !== undefined) {
      setSystemStatus(data.systemStatus)
    }
    if (data.lastEvent !== undefined) {
      setLastEvent(data.lastEvent)
    }
    if (data.isIsolated !== undefined) {
      setIsIsolated(data.isIsolated)
    }
  }, [])

  // Poll for new threats and trigger alerts
  useEffect(() => {
    const checkForNewThreats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/threat-history`)
        if (!response.ok) return
        
        const data = await response.json()
        const threats = data.threats || []
        
        if (threats.length === 0) {
          isFirstLoad.current = false
          return
        }
        
        // Get the most recent threat
        const latestThreat = threats[0]
        const latestTimestamp = new Date(latestThreat.timestamp).getTime()
        
        // On first load, just record the timestamp without alerting
        if (isFirstLoad.current) {
          lastThreatTimestamp.current = latestTimestamp
          isFirstLoad.current = false
          return
        }
        
        // Check if this is a new threat
        if (lastThreatTimestamp.current === null || latestTimestamp > lastThreatTimestamp.current) {
          lastThreatTimestamp.current = latestTimestamp
          
          // Trigger alert for the new threat
          showAlert({
            event_type: latestThreat.event_type,
            severity: latestThreat.severity,
            trust_score_before: latestThreat.trust_score_before,
            trust_score_after: latestThreat.trust_score_after,
            timestamp: latestThreat.timestamp,
            description: `Security threat detected: ${latestThreat.event_type}`
          })
        }
      } catch (err) {
        console.error('Failed to check for new threats:', err)
      }
    }
    
    // Initial check
    checkForNewThreats()
    
    // Poll every 3 seconds for real-time alerts
    const interval = setInterval(checkForNewThreats, 3000)
    
    return () => clearInterval(interval)
  }, [showAlert])

  const value = {
    trustScore,
    systemStatus,
    lastEvent,
    isIsolated,
    updateSystemState,
    alert,
    showAlert,
    dismissAlert,
  }

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>
}

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider')
  }
  return context
}
