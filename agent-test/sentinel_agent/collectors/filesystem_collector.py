# sentinel_agent/collectors/filesystem_collector.py

import time
import os
import hashlib

WATCH_PATHS = [
    os.path.expanduser("~"),
    "/tmp" if os.name != "nt" else "C:\\Windows\\Temp"
]


def hash_file(path):
    try:
        with open(path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception:
        return None


def start_filesystem_collector(context_manager, poll_interval=3):
    print("[FileSystemCollector] Started")

    file_state = {}

    while True:
        try:
            for base in WATCH_PATHS:
                for root, _, files in os.walk(base):
                    for name in files:
                        path = os.path.join(root, name)

                        try:
                            mtime = os.path.getmtime(path)

                            if path not in file_state:
                                file_state[path] = mtime
                                continue

                            if file_state[path] != mtime:
                                file_state[path] = mtime

                                event = {
                                    "event_type": "file_modified",
                                    "file_path": path,
                                    "hash": hash_file(path)
                                }

                                # file events are attached later via PID correlation
                                context_manager.add_event(
                                    list(context_manager.contexts.keys())[-1],
                                    event
                                )

                        except Exception:
                            continue

            time.sleep(poll_interval)

        except Exception as e:
            print("[FileSystemCollector] Error:", e)
            time.sleep(2)