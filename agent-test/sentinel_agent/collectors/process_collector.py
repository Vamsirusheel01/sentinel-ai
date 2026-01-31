# sentinel_agent/collectors/process_collector.py

import time
import psutil

from context_engine.context_linker import ContextLinker

# global linker (shared mapping PID -> context)
context_linker = ContextLinker()


def start_process_collector(context_manager, poll_interval=1):
    """
    Monitors process start events and creates contexts
    """
    print("[ProcessCollector] Started")

    known_pids = set(psutil.pids())

    while True:
        try:
            current_pids = set(psutil.pids())
            new_pids = current_pids - known_pids

            for pid in new_pids:
                try:
                    proc = psutil.Process(pid)

                    event = {
                        "event_type": "process_start",
                        "pid": pid,
                        "ppid": proc.ppid(),
                        "process_name": proc.name(),
                        "exe": proc.exe() if proc.exe() else None,
                        "cmdline": " ".join(proc.cmdline()),
                        "username": proc.username()
                    }

                    # Create new context for this process
                    context_id = context_manager.create_context(event)

                    # Attach event to context
                    context_manager.add_event(context_id, event)

                    # Link PID to context for future events
                    context_linker.link_process(pid, context_id)

                    print(f"[ProcessCollector] New process: {proc.name()} (PID {pid}) → {context_id}")

                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            known_pids = current_pids
            time.sleep(poll_interval)

        except Exception as e:
            print("[ProcessCollector] Error:", e)
            time.sleep(1)