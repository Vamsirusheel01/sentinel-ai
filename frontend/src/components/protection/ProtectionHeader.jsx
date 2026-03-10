import React, { useState } from 'react';
import { useProtection } from '../../context/ProtectionContext';

const ProtectionHeader = () => {
  const { isMonitoring, startMonitoring, stopMonitoring } = useProtection();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add this missing block!
  const handleStart = async () => {
    try {
      await startMonitoring(); // Or whatever your API call is named
    } catch (err) {
      setError('Failed to start monitoring: Backend unreachable.');
    }
  };

  // You likely already have this one:
  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopMonitoring();
      setIsMonitoring(false);
      setAlerts([]); // Clear alerts
      setHistory([]); // Clear timeline
    } catch (err) {
      setError('Failed to stop monitoring: Backend unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0 24px' }}>
      <div>
        <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>Protection Center</span>
        <span style={{ color: '#94a3b8', fontSize: 16, marginLeft: 16 }}>Monitor your system security in real time</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: '#fff', fontSize: 18, fontWeight: 500 }}>
          Protection: {isMonitoring ? 'Running' : 'Stopped'}
        </span>
        {isMonitoring ? (
          <button
            onClick={handleStop}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleStart}
            style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          >
            Start
          </button>
        )}
      </div>
      {error && (
        <div style={{ color: '#ef4444', marginTop: 8, fontWeight: 500, position: 'absolute', right: 32, top: 64 }}>{error}</div>
      )}
    </div>
  );
};

export default ProtectionHeader;
