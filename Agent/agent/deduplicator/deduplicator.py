_seen = set()


def deduplicate(events):
    unique = []
    for e in events:
        key = (e.get("event_type"), e.get("pid"), e.get("timestamp") // 5)
        if key not in _seen:
            _seen.add(key)
            unique.append(e)
    return unique