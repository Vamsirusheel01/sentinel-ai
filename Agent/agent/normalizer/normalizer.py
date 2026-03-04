from datetime import datetime


def normalize(event):
    """Normalize event to ensure all required fields are present."""
    # Ensure required fields exist with defaults
    event["process_name"] = event.get("process_name", "unknown")
    event["event_type"] = event.get("event_type", "unknown")
    event["severity"] = event.get("severity", "low")
    
    # Ensure timestamp is ISO format string
    ts = event.get("timestamp")
    if ts is None:
        event["timestamp"] = datetime.utcnow().isoformat()
    elif isinstance(ts, (int, float)):
        event["timestamp"] = datetime.utcfromtimestamp(ts).isoformat()
    elif not isinstance(ts, str):
        event["timestamp"] = str(ts)
    
    event["normalized"] = True
    return event