import psutil
import time
import ipaddress


# Internal/private IP ranges to ignore
def _is_internal_ip(addr_str):
    """Return True if the address is localhost, private, or empty."""
    if not addr_str or addr_str in ("", "()", "None"):
        return True
    try:
        # psutil returns addr() named tuples; extract IP string
        ip_str = addr_str
        if isinstance(addr_str, tuple):
            ip_str = addr_str[0] if addr_str else ""
        elif addr_str.startswith("addr("):
            ip_str = addr_str.split("'")[1] if "'" in addr_str else ""

        if not ip_str or ip_str in ("0.0.0.0", "::", "*"):
            return True

        ip = ipaddress.ip_address(ip_str)
        return ip.is_loopback or ip.is_private or ip.is_reserved
    except (ValueError, IndexError):
        return True


# Ports commonly used by browsers / OS updates — not suspicious
_BENIGN_PORTS = {80, 443, 8080}


def collect_network_events():
    """Collect only abnormal external network connections."""
    events = []
    for conn in psutil.net_connections(kind='inet'):
        if not conn.pid or conn.status != "ESTABLISHED":
            continue

        # Skip connections with no remote address or to internal IPs
        if not conn.raddr or _is_internal_ip(conn.raddr):
            continue

        remote_ip = conn.raddr[0] if conn.raddr else ""
        remote_port = conn.raddr[1] if conn.raddr and len(conn.raddr) > 1 else 0

        # Try to get process name for context
        try:
            proc = psutil.Process(conn.pid)
            proc_name = proc.name()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            proc_name = "unknown"

        # Flag as beacon if using a non-standard port to an external IP
        if remote_port not in _BENIGN_PORTS:
            event_type = "network_beacon"
        else:
            event_type = "network_connection"

        events.append({
            "event_type": event_type,
            "pid": conn.pid,
            "process_name": proc_name,
            "local_address": str(conn.laddr),
            "remote_address": str(conn.raddr),
            "remote_ip": remote_ip,
            "remote_port": remote_port,
            "status": conn.status,
            "timestamp": time.time()
        })
    return events