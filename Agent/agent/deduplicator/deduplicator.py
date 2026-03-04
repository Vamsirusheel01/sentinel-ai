import time

_seen = set()


def deduplicate(events):
    unique = []
    seen_this_cycle = set()
    for e in events:
        ts = e.get("timestamp")
        try:
            ts = int(ts)
        except (TypeError, ValueError):
            ts = int(time.time())

        # Deduplicate by process_name + command_line within this cycle
        proc_name = e.get("process_name", "")
        cmd_line = e.get("cmdline") or e.get("command_line") or ""
        cycle_key = (proc_name, cmd_line)
        if cycle_key in seen_this_cycle:
            continue
        seen_this_cycle.add(cycle_key)

        # Deduplicate across cycles by event_type + pid + time bucket
        global_key = (e.get("event_type"), e.get("pid"), ts // 5)
        if global_key not in _seen:
            _seen.add(global_key)
            unique.append(e)
    return unique