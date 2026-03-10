import React from 'react';
import ProtectionHeader from '../components/protection/ProtectionHeader';
import BackendAgentStatus from '../components/protection/BackendAgentStatus';
import TrustScoreCard from '../components/protection/TrustScoreCard';
import TrustScoreTimeline from '../components/protection/TrustScoreTimeline';
import AlertsFeed from '../components/protection/AlertsFeed';
import useProtectionPolling from '../hooks/useProtectionPolling';

const ProtectionCenter = () => {
  useProtectionPolling();
  return (
    <div style={{ background: '#1e293b', minHeight: '100vh', padding: 0 }}>
      <ProtectionHeader />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <BackendAgentStatus />
        <div style={{ display: 'flex', gap: 24, marginTop: 0 }}>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <TrustScoreCard />
            <TrustScoreTimeline />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <AlertsFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectionCenter;
