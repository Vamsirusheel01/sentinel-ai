# sentinel_agent/cleaner/normalizer.py

import time


def normalize_event(event, context_id):
    """
    Normalizes any event into a common schema
    """
    return {
        "context_id": context_id,
        "event_type": event.get("event_type"),
        "timestamp": event.get("timestamp", time.time()),
        "pid": event.get("pid"),
        "process_name": event.get("process_name"),
        "details": event
    }