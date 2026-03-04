import psutil
import time


# Processes that are suspicious / commonly abused by attackers
_SUSPICIOUS_NAMES = {
    "powershell.exe", "pwsh.exe", "cmd.exe",
    "wscript.exe", "cscript.exe", "mshta.exe",
    "certutil.exe", "bitsadmin.exe", "regsvr32.exe",
    "rundll32.exe", "msiexec.exe", "schtasks.exe",
    "net.exe", "net1.exe", "whoami.exe", "nltest.exe",
    "mimikatz.exe", "procdump.exe", "psexec.exe",
    "nc.exe", "ncat.exe", "netcat.exe",
    # Linux equivalents
    "bash", "sh", "curl", "wget", "nc", "ncat",
    "python", "python3", "perl", "ruby",
}

# Suspicious command-line keywords (even if process name looks benign)
_SUSPICIOUS_CMDLINE_KEYWORDS = [
    "-encodedcommand", "-enc ", "downloadstring",
    "invoke-expression", "iex ", "bypass", "-nop",
    "hidden", "-w hidden", "reverse", "bind",
    "/transfer", "certutil", "base64",
    "mimikatz", "sekurlsa", "lsadump",
]


def _is_suspicious(name, cmdline):
    """Return True if the process looks suspicious."""
    if not name:
        return False
    name_lower = name.lower()
    if name_lower in _SUSPICIOUS_NAMES:
        return True
    if cmdline:
        cmd_lower = cmdline.lower()
        return any(kw in cmd_lower for kw in _SUSPICIOUS_CMDLINE_KEYWORDS)
    return False


def collect_process_events():
    """Collect only suspicious process events."""
    events = []
    try:
        for proc in psutil.process_iter(['pid', 'ppid', 'name', 'cmdline', 'username']):
            try:
                name = proc.info['name'] or ""
                cmdline = " ".join(proc.info['cmdline']) if proc.info['cmdline'] else ""

                if not _is_suspicious(name, cmdline):
                    continue

                events.append({
                    "event_type": "suspicious_process",
                    "pid": proc.info['pid'],
                    "ppid": proc.info['ppid'],
                    "process_name": name,
                    "cmdline": cmdline,
                    "user": proc.info['username'],
                    "timestamp": time.time()
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, PermissionError):
                continue
    except (psutil.NoSuchProcess, psutil.AccessDenied, PermissionError):
        pass
    return events