import platform
import socket
import getpass
import uuid


def collect_identity():
    return {
        "device_id": str(uuid.getnode()),
        "hostname": socket.gethostname(),
        "os": platform.system(),
        "os_version": platform.version(),
        "architecture": platform.machine(),
        "user": getpass.getuser()
    }