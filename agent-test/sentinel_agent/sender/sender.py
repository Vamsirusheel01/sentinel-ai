# sentinel_agent/sender/sender.py

import time

from buffer.queue import dequeue_batch, move_to_retry
from sender.api_client import send_payload


def start_sender_loop(interval=10, batch_size=10):
    print("[Sender] Started")

    while True:
        try:
            batch = dequeue_batch(batch_size)

            if not batch:
                time.sleep(interval)
                continue

            success = send_payload(batch)

            if success:
                print(f"[Sender] Sent batch of {len(batch)}")
            else:
                move_to_retry(batch)
                print("[Sender] Send failed, moved to retry")

        except Exception as e:
            print("[Sender] Error:", e)
            time.sleep(interval)