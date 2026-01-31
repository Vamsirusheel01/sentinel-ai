# sentinel_agent/buffer/queue.py

import json
import os
import threading

BASE_DIR = os.path.dirname(__file__)
QUEUE_FILE = os.path.join(BASE_DIR, "clean_context_queue.jsonl")
RETRY_FILE = os.path.join(BASE_DIR, "retry_queue.jsonl")

lock = threading.Lock()


def enqueue(context):
    """
    Add clean context to outbound queue
    """
    with lock:
        with open(QUEUE_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(context) + "\n")


def dequeue_batch(batch_size=10):
    """
    Read and remove a batch from queue
    """
    with lock:
        if not os.path.exists(QUEUE_FILE):
            return []

        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()

        batch = lines[:batch_size]
        remaining = lines[batch_size:]

        with open(QUEUE_FILE, "w", encoding="utf-8") as f:
            f.writelines(remaining)

    return [json.loads(line) for line in batch]


def move_to_retry(batch):
    """
    Move failed batch to retry queue
    """
    with lock:
        with open(RETRY_FILE, "a", encoding="utf-8") as f:
            for item in batch:
                f.write(json.dumps(item) + "\n")