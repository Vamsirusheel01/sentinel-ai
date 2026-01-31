# sentinel_agent/identity/device_identity.py

import socket
import platform
import uuid


def get_device_identity():
    """
    Returns static device identity information
    """
    return {
        "device_id": str(uuid.getnode()),
        "hostname": socket.gethostname(),
        "os": platform.system(),
        "os_version": platform.version(),
        "architecture": platform.machine()
    }