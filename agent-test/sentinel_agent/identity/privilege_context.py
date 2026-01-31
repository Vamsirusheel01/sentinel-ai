# sentinel_agent/identity/privilege_context.py

import os
import ctypes
import platform


def is_admin():
    """
    Checks if current user has admin privileges
    """
    try:
        if platform.system() == "Windows":
            return ctypes.windll.shell32.IsUserAnAdmin() == 1
        else:
            return os.geteuid() == 0
    except Exception:
        return False


def get_privilege_context():
    return {
        "is_admin": is_admin()
    }