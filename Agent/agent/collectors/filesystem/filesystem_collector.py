import os
import time


WATCH_PATHS = ["/tmp", "/var/tmp"] if os.name != "nt" else ["C:\\Windows\\Temp"]

# Only flag these suspicious file types
_SUSPICIOUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".ps1", ".vbs", ".js",
    ".scr", ".dll", ".hta", ".wsf", ".com", ".msi",
    ".pif", ".reg", ".inf",
}

# Size threshold — tiny executables in temp dirs are suspicious
_MIN_SIZE_BYTES = 0  # report any suspicious extension regardless of size


def collect_filesystem_events():
    """Collect only suspicious file activity in temp/watched directories."""
    events = []
    for path in WATCH_PATHS:
        if not os.path.exists(path):
            continue
        for root, _, files in os.walk(path):
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext not in _SUSPICIOUS_EXTENSIONS:
                    continue

                full_path = os.path.join(root, f)
                try:
                    size = os.path.getsize(full_path)
                except OSError:
                    size = -1

                events.append({
                    "event_type": "suspicious_file",
                    "file_path": full_path,
                    "file_name": f,
                    "extension": ext,
                    "size_bytes": size,
                    "timestamp": time.time()
                })
    return events