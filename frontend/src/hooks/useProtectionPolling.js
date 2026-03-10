import { useEffect, useRef } from 'react';
import { useProtection } from '../context/ProtectionContext';
import { getSystemStatus, getTrustHistory, getAlerts } from '../services/protectionApi';

export default function useProtectionPolling() {
	const {
		isMonitoring,
		setTrustScore,
		setAlerts,
		setBackendStatus,
		setAgentStatus,
		// Optionally add setTrustHistory if you want to store timeline in context
	} = useProtection();
	const intervalRef = useRef();

	useEffect(() => {
		const poll = async () => {
			try {
				const sys = await getSystemStatus();
				if (sys) {
					if (typeof sys.trust_score === 'number') setTrustScore(sys.trust_score);
					if (typeof sys.backend === 'boolean') setBackendStatus(sys.backend ? 'running' : 'stopped');
					if (typeof sys.agent === 'boolean') setAgentStatus(sys.agent ? 'running' : 'stopped');
				}
				const alerts = await getAlerts();
				if (Array.isArray(alerts)) setAlerts(alerts);
				// Optionally fetch and store trust history in context
			} catch {}
		};
		if (isMonitoring) {
			poll();
			intervalRef.current = setInterval(poll, 5000);
		}
		return () => intervalRef.current && clearInterval(intervalRef.current);
	}, [isMonitoring, setTrustScore, setAlerts, setBackendStatus, setAgentStatus]);
}
