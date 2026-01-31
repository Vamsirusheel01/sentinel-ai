# sentinel_agent/cleaner/deduplicator.py

DEDUP_WINDOW = 2  # seconds


def deduplicate_events(events):
    """
    Deduplicates events inside a context
    """
    deduped = []
    seen = {}

    for event in events:
        key = (event["event_type"], event.get("pid"))

        last_time = seen.get(key)
        if last_time and (event["timestamp"] - last_time) < DEDUP_WINDOW:
            continue

        seen[key] = event["timestamp"]
        deduped.append(event)

    return deduped