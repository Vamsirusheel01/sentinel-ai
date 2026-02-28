import psutil
import time


def collect_process_events():
    events = []
    try:
        for proc in psutil.process_iter(['pid', 'ppid', 'name', 'cmdline', 'username']):
            try:
                events.append({
                    "event_type": "process_start",
                    "pid": proc.info['pid'],
                    "ppid": proc.info['ppid'],
                    "process_name": proc.info['name'],
                    "cmdline": " ".join(proc.info['cmdline']) if proc.info['cmdline'] else "",
                    "user": proc.info['username'],
                    "timestamp": time.time()
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, PermissionError):
                continue
    except (psutil.NoSuchProcess, psutil.AccessDenied, PermissionError):
        pass
    return events