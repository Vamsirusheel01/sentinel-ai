# sentinel_agent/agent.py

import threading
import time
import signal
import sys
import os

from utils.config_loader import load_config
from utils.logger import logger
from retention.raw_retention import start_raw_retention

from identity.device_identity import get_device_identity
from identity.user_context import get_user_context

from context_engine.context_manager import ContextManager

from collectors.process_collector import start_process_collector
from collectors.network_collector import start_network_collector
from collectors.filesystem_collector import start_filesystem_collector
from collectors.memory_collector import start_memory_collector
from collectors.access_collector import start_access_collector
from collectors.persistence_collector import start_persistence_collector

from sender.sender import start_sender_loop


# ---------------- DEV RESET (SAFE) ----------------

def reset_dev_files():
    """
    DEV MODE ONLY:
    Clears state and buffer files to avoid stale data
    """
    files_to_reset = [
        "state/active_contexts.json",
        "state/process_state.json",
        "state/network_state.json",
        "buffer/clean_context_queue.jsonl",
        "buffer/retry_queue.jsonl",
    ]

    for path in files_to_reset:
        try:
            if os.path.exists(path):
                open(path, "w").close()
        except Exception as e:
            logger.warning(f"Failed to reset {path}: {e}")


class SentinelAgent:
    def __init__(self):
        self.running = False

        # 🔹 LOAD timing.yaml (NO CHANGE TO YAML)
        self.timing = load_config("config/timing.yaml")

        self.device_identity = None
        self.user_context = None
        self.context_manager = None

    # ---------------- INITIALIZATION ----------------

    def initialize(self):
        logger.info("Initializing Sentinel AI Agent")

        # 🔥 RESET state/ & buffer/ (DEV ONLY)
        reset_dev_files()
        # 🔥 START RAW STORE RETENTION (ADD THIS LINE)
        start_raw_retention()


        self.device_identity = get_device_identity()
        self.user_context = get_user_context()

        # Context manager uses timeout from YAML
        self.context_manager = ContextManager(
            device_identity=self.device_identity,
            user_context=self.user_context,
            context_timeout=self.timing["context"]["context_timeout"]
        )

        # Start context expiry watcher
        self.context_manager.start_context_watcher(
            check_interval=1
        )

    # ---------------- COLLECTORS ----------------

    def start_collectors(self):
        logger.info("Starting collectors")

        c = self.timing["collectors"]

        threading.Thread(
            target=start_process_collector,
            args=(self.context_manager, c["process_poll_interval"]),
            daemon=True
        ).start()

        threading.Thread(
            target=start_network_collector,
            args=(self.context_manager, c["network_poll_interval"]),
            daemon=True
        ).start()

        threading.Thread(
            target=start_filesystem_collector,
            args=(self.context_manager, c["filesystem_poll_interval"]),
            daemon=True
        ).start()

        threading.Thread(
            target=start_memory_collector,
            args=(self.context_manager, c["memory_poll_interval"]),
            daemon=True
        ).start()

        threading.Thread(
            target=start_access_collector,
            args=(self.context_manager, c["access_poll_interval"]),
            daemon=True
        ).start()

        threading.Thread(
            target=start_persistence_collector,
            args=(self.context_manager, c["persistence_poll_interval"]),
            daemon=True
        ).start()

    # ---------------- SENDER ----------------

    def start_sender(self):
        s = self.timing["sender"]

        threading.Thread(
            target=start_sender_loop,
            args=(s["send_interval"], s["max_batch_size"]),
            daemon=True
        ).start()

    # ---------------- SHUTDOWN ----------------

    def shutdown(self, *args):
        logger.warning("Graceful shutdown initiated")

        # Close all active contexts
        for ctx_id in list(self.context_manager.contexts.keys()):
            self.context_manager.lifecycle.close_context(ctx_id)

        time.sleep(2)
        sys.exit(0)

    # ---------------- RUN ----------------

    def run(self):
        self.running = True

        signal.signal(signal.SIGINT, self.shutdown)
        signal.signal(signal.SIGTERM, self.shutdown)

        self.initialize()
        self.start_collectors()
        self.start_sender()

        logger.info("Sentinel AI Agent is running")

        while self.running:
            time.sleep(1)


if __name__ == "__main__":
    agent = SentinelAgent()
    agent.run()