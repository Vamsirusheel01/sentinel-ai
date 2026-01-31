import time
import os


def collect_persistence_events():
    events = []

    startup_paths = []
    if os.name == "nt":
        startup_paths.append(os.path.expandvars("%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"))

    for path in startup_paths:
        if os.path.exists(path):
            for item in os.listdir(path):
                events.append({
                    "event_type": "persistence_detected",
                    "path": os.path.join(path, item),
                    "timestamp": time.time()
                })

    return events