# sentinel_agent/collectors/access_collector.py

import os
import time

PROTECTED_PATHS = [
    "/etc" if os.name != "nt" else "C:\\Windows\\System32"
]


def start_access_collector(context_manager, poll_interval=5):
    print("[AccessCollector] Started")

    while True:
        try:
            for path in PROTECTED_PATHS:
                try:
                    os.listdir(path)
                except PermissionError:
                    event = {
                        "event_type": "unauthorized_access_attempt",
                        "path": path
                    }

                    context_manager.add_event(
                        list(context_manager.contexts.keys())[-1],
                        event
                    )

            time.sleep(poll_interval)

        except Exception as e:
            print("[AccessCollector] Error:", e)
            time.sleep(2)