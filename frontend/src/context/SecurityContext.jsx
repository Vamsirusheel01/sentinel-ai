import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const SecurityContext = createContext()

import { API_BASE_URL } from '../config/api';
export function SecurityProvider({ children }) {
  const [trustScore, setTrustScore] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)
  const [lastEvent, setLastEvent] = useState(null)
  const [isIsolated, setIsIsolated] = useState(false)
  const [alert, setAlert] = useState(null)
  const [alertQueue, setAlertQueue] = useState([])
  // Removed duplicate API_BASE_URL declaration. Use API_BASE from config/api.js
  
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
      // Removed polling for new threats
    }
    
    // Removed initial check for new threats
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
