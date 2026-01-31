# sentinel_agent/collectors/persistence_collector.py

import os
import time

STARTUP_PATH = (
    os.path.expanduser("~/.config/autostart")
    if os.name != "nt"
    else os.path.expandvars(
        "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
    )
)


def start_persistence_collector(context_manager, poll_interval=5):
    print("[PersistenceCollector] Started")

    known_files = set()

    while True:
        try:
            if os.path.exists(STARTUP_PATH):
                for f in os.listdir(STARTUP_PATH):
                    if f not in known_files:
                        known_files.add(f)

                        event = {
                            "event_type": "persistence_created",
                            "location": STARTUP_PATH,
                            "file": f
                        }

                        context_manager.add_event(
                            list(context_manager.contexts.keys())[-1],
                            event
                        )

            time.sleep(poll_interval)

        except Exception as e:
            print("[PersistenceCollector] Error:", e)
            time.sleep(2)