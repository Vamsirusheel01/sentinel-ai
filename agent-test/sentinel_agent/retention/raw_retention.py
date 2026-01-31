import os
import time
import threading

RAW_STORE_DIR = "raw_store"
RETENTION_HOURS = 6        # change later via config if needed
CHECK_INTERVAL = 300       # seconds (5 min)


def start_raw_retention():
    def cleaner():
        while True:
            cutoff = time.time() - (RETENTION_HOURS * 3600)

            for fname in os.listdir(RAW_STORE_DIR):
                path = os.path.join(RAW_STORE_DIR, fname)
                if not os.path.isfile(path):
                    continue

                if os.path.getmtime(path) < cutoff:
                    try:
                        os.remove(path)
                    except:
                        pass

            time.sleep(CHECK_INTERVAL)

    threading.Thread(target=cleaner, daemon=True).start()