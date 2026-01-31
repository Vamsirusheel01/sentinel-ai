import os
import time


def collect_privilege_events():
    return [{
        "event_type": "privilege_context",
        "is_admin": os.geteuid() == 0 if hasattr(os, "geteuid") else None,
        "timestamp": time.time()
    }]