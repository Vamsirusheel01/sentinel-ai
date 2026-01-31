def evaluate(events):
    for e in events:
        e["risk"] = "low"
        if e.get("event_type") == "process_start" and "powershell" in e.get("process_name", "").lower():
            e["risk"] = "high"
    return events