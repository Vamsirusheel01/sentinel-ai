import time

# === API GATEWAY (CENTRALIZED HERE) ===
API_URL = "http://probable-dollop-g4xw7j4gv66ghv9pw-5000.app.github.dev/api/logs"


def build_payload(
    identity,
    system_snapshot,
    process_events,
    network_events,
    filesystem_events,
    persistence_events,
    privilege_events,
    risk_summary
):
    """
    Build ONE unified JSON payload from all agent modules.
    This is the ONLY object sent to the backend.
    """

    payload = {
        "identity": {
            "device_id": identity.get("device_id"),
            "hostname": identity.get("hostname"),
            "os": identity.get("os"),
            "os_version": identity.get("os_version"),
            "architecture": identity.get("architecture"),
            "user": identity.get("user")
        },

        "system_snapshot": {
            "cpu": system_snapshot.get("cpu"),
            "ram": system_snapshot.get("ram"),
            "process_count": system_snapshot.get("processes"),
            "ip": system_snapshot.get("ip")
        },

        "process_telemetry": process_events,
        "network_telemetry": network_events,
        "filesystem_activity": filesystem_events,
        "persistence_events": persistence_events,
        "privilege_events": privilege_events,

        "risk_summary": {
            "trust_score": risk_summary.get("trust_score"),
            "risk_level": risk_summary.get("risk_level"),
            "high_risk_events": risk_summary.get("high_risk_events")
        },

        "timestamp": int(time.time())
    }

    return payload