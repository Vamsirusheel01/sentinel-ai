import os
import ctypes
import time


def _is_admin():
    """Check if the current process has admin/root privileges."""
    if hasattr(os, "geteuid"):
        return os.geteuid() == 0
    # Windows: use ctypes to check for admin
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except (AttributeError, OSError):
        return False


def collect_privilege_events():
    """Only emit an event when elevated/admin privileges are detected."""
    if _is_admin():
        return [{
            "event_type": "privilege_escalation",
            "is_admin": True,
            "timestamp": time.time()
        }]
    return []