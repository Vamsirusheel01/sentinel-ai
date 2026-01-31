import os
import time


WATCH_PATHS = ["/tmp", "/var/tmp"] if os.name != "nt" else ["C:\\Windows\\Temp"]


def collect_filesystem_events():
    events = []
    for path in WATCH_PATHS:
        if os.path.exists(path):
            for root, _, files in os.walk(path):
                for f in files:
                    full_path = os.path.join(root, f)
                    events.append({
                        "event_type": "file_activity",
                        "file_path": full_path,
                        "timestamp": time.time()
                    })
    return events