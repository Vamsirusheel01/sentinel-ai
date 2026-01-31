import psutil
import time


def collect_network_events():
    events = []
    for conn in psutil.net_connections(kind='inet'):
        if conn.pid:
            events.append({
                "event_type": "network_connection",
                "pid": conn.pid,
                "local_address": str(conn.laddr),
                "remote_address": str(conn.raddr),
                "status": conn.status,
                "timestamp": time.time()
            })
    return events