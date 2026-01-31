# sentinel_agent/utils/time_utils.py

import time
from datetime import datetime


def now_ts():
    """Returns epoch timestamp"""
    return time.time()


def now_iso():
    """Returns ISO 8601 timestamp"""
    return datetime.utcnow().isoformat() + "Z"