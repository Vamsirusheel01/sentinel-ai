# sentinel_agent/collectors/memory_collector.py

import time
import psutil

from context_engine.context_linker import ContextLinker

context_linker = ContextLinker()


def start_memory_collector(context_manager, poll_interval=3):
    print("[MemoryCollector] Started")

    while True:
        try:
            for proc in psutil.process_iter(["pid", "memory_info", "name"]):
                pid = proc.info["pid"]
                mem = proc.info["memory_info"].rss / (1024 * 1024)

                if mem > 500:  # high memory usage (MB)
                    context_id = context_linker.get_context_for_pid(pid)
                    if not context_id:
                        continue

                    event = {
                        "event_type": "high_memory_usage",
                        "pid": pid,
                        "process": proc.info["name"],
                        "memory_mb": mem
                    }

                    context_manager.add_event(context_id, event)

            time.sleep(poll_interval)

        except Exception as e:
            print("[MemoryCollector] Error:", e)
            time.sleep(2)