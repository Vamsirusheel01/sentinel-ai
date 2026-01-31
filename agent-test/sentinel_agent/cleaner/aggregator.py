# sentinel_agent/cleaner/aggregator.py


def aggregate_events(events):
    """
    Aggregates similar consecutive events
    """
    if not events:
        return []

    aggregated = []
    current = events[0].copy()
    current["count"] = 1

    for event in events[1:]:
        if (
            event["event_type"] == current["event_type"]
            and event.get("pid") == current.get("pid")
        ):
            current["count"] += 1
        else:
            aggregated.append(current)
            current = event.copy()
            current["count"] = 1

    aggregated.append(current)
    return aggregated