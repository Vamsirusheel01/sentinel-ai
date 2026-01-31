# sentinel_agent/raw_store/writer.py

import json
import os
import threading
import time

BASE_DIR = os.path.dirname(__file__)

RAW_FILES = {
    "process_start": "process_raw.jsonl",
    "network_connect": "network_raw.jsonl",
    "file_created": "filesystem_raw.jsonl",
    "file_modified": "filesystem_raw.jsonl",
    "file_deleted": "filesystem_raw.jsonl",
    "unauthorized_access_attempt": "access_raw.jsonl",
    "high_memory_usage": "memory_raw.jsonl",
    "persistence_created": "persistence_raw.jsonl"
}

lock = threading.Lock()


def write_raw_event(event):
    """
    Writes raw event to appropriate raw_store file
    """
    event_type = event.get("event_type")
    filename = RAW_FILES.get(event_type)

    if not filename:
        return  # unknown event type, ignore silently

    path = os.path.join(BASE_DIR, filename)

    event["_raw_timestamp"] = time.time()

    with lock:
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")