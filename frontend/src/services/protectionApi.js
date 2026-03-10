const API_BASE = 'http://127.0.0.1:5000';

export async function startProtection() {
	const res = await fetch(`${API_BASE}/api/start-protection`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	});
	if (!res.ok) throw new Error('Failed to start protection');
	return res.json ? res.json() : undefined;
}

export async function stopProtection() {
	const res = await fetch(`${API_BASE}/api/stop-protection`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	});
	if (!res.ok) throw new Error('Failed to stop protection');
	return res.json ? res.json() : undefined;
}

export async function getSystemStatus() {
	const res = await fetch(`${API_BASE}/api/system-status`);
	if (!res.ok) throw new Error('Failed to fetch system status');
	return res.json();
}

export async function getTrustHistory() {
	const res = await fetch(`${API_BASE}/api/trust-history`);
	if (!res.ok) throw new Error('Failed to fetch trust history');
	return res.json();
}

export async function getAlerts() {
	const res = await fetch(`${API_BASE}/api/alerts`);
	if (!res.ok) throw new Error('Failed to fetch alerts');
	return res.json();
}
