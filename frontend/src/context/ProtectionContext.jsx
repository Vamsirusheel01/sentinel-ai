import React, { createContext, useContext, useState, useCallback } from 'react';
import { startProtection as apiStartProtection, stopProtection as apiStopProtection } from '../services/protectionApi';

const ProtectionContext = createContext();

export const ProtectionProvider = ({ children }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [trustScore, setTrustScore] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [backendStatus, setBackendStatus] = useState('stopped');
  const [agentStatus, setAgentStatus] = useState('stopped');

  const startMonitoring = useCallback(async () => {
    await apiStartProtection();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(async () => {
    await apiStopProtection();
    setIsMonitoring(false);
  }, []);

  return (
    <ProtectionContext.Provider value={{
      isMonitoring,
      trustScore,
      alerts,
      backendStatus,
      agentStatus,
      setTrustScore,
      setAlerts,
      setBackendStatus,
      setAgentStatus,
      startMonitoring,
      stopMonitoring
    }}>
      {children}
    </ProtectionContext.Provider>
  );
};

export const useProtection = () => useContext(ProtectionContext);
