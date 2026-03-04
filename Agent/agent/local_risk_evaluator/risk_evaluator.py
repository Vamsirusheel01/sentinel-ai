def evaluate(events):
    """Evaluate events and assign severity levels."""
    for e in events:
        event_type = e.get("event_type", "")
        process_name = e.get("process_name", "").lower()
        cmdline = (e.get("cmdline") or e.get("command_line") or "").lower()

        # Default severity
        severity = "low"

        # Critical patterns
        if event_type == "privilege_escalation":
            severity = "critical"
        elif event_type == "persistence_created":
            severity = "critical"
        # Encoded PowerShell
        elif "powershell" in process_name and ("-enc" in cmdline or "-encodedcommand" in cmdline):
            severity = "critical"
        # Reverse shell
        elif any(rs in cmdline for rs in ["nc.exe", "ncat", "bash -i", "powershell -nop -w hidden -c", "socket", "connect", "reverse shell"]):
            severity = "critical"
        # Admin creation
        elif any(ac in cmdline for ac in ["net user", "add user", "net localgroup administrators", "add"]):
            severity = "critical"
        # Suspicious process burst
        elif event_type == "process_start" and any(p in process_name for p in ["powershell", "cmd", "wscript", "cscript"]):
            # If suspicious command line, escalate
            if any(s in cmdline for s in ["download", "invoke-webrequest", "iex", "curl", "wget", "bypass", "payload", "meterpreter"]):
                severity = "critical"
            else:
                severity = "high"
        elif event_type == "network_connect":
            severity = "medium"
        elif event_type == "file_modified":
            severity = "medium"

        e["severity"] = severity
        e["risk"] = severity  # Keep risk for backwards compatibility
    return events