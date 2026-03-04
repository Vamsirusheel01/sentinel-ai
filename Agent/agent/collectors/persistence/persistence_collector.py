import time
import os
import winreg


# Suspicious file extensions in startup folders
_SUSPICIOUS_EXTENSIONS = {".exe", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".lnk", ".scr"}

# Registry Run keys commonly abused for persistence
_REGISTRY_RUN_KEYS = [
    (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run"),
    (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\RunOnce"),
    (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\Run"),
    (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\RunOnce"),
] if os.name == "nt" else []


def _check_registry_persistence():
    """Check Windows registry Run keys for persistence entries."""
    events = []
    for hive, key_path in _REGISTRY_RUN_KEYS:
        try:
            with winreg.OpenKey(hive, key_path) as key:
                i = 0
                while True:
                    try:
                        name, value, _ = winreg.EnumValue(key, i)
                        events.append({
                            "event_type": "persistence_created",
                            "persistence_type": "registry_run_key",
                            "registry_key": key_path,
                            "entry_name": name,
                            "entry_value": value,
                            "timestamp": time.time()
                        })
                        i += 1
                    except OSError:
                        break
        except (OSError, PermissionError):
            continue
    return events


def collect_persistence_events():
    """Detect persistence mechanisms — startup folders and registry Run keys."""
    events = []

    # --- Startup folder check ---
    startup_paths = []
    if os.name == "nt":
        startup_paths.append(
            os.path.expandvars("%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup")
        )

    for path in startup_paths:
        if os.path.exists(path):
            for item in os.listdir(path):
                ext = os.path.splitext(item)[1].lower()
                if ext in _SUSPICIOUS_EXTENSIONS:
                    events.append({
                        "event_type": "persistence_created",
                        "persistence_type": "startup_folder",
                        "path": os.path.join(path, item),
                        "timestamp": time.time()
                    })

    # --- Registry Run key check (Windows only) ---
    if os.name == "nt":
        events.extend(_check_registry_persistence())

    return events