# sentinel_agent/identity/user_context.py

import getpass
import os


def get_user_context():
    """
    Returns current user session context
    """
    return {
        "username": getpass.getuser(),
        "uid": os.getuid() if hasattr(os, "getuid") else None,
        "session_type": "local"
    }