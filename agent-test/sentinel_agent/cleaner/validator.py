# sentinel_agent/cleaner/validator.py


REQUIRED_FIELDS = ["event_type", "timestamp"]


def validate_event(event):
    """
    Validates normalized event
    """
    for field in REQUIRED_FIELDS:
        if field not in event or event[field] is None:
            return False
    return True