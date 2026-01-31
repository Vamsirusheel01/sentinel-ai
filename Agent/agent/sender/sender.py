import requests
import json
from datetime import datetime

API_URL = "http://127.0.0.1:5000/api/logs"
TIMEOUT = 5


def send(payload):
    """
    Sends ONE aggregated JSON payload to the local server
    and also displays it on localhost console for debugging.
    """
    if not payload:
        return None

    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    # ---- Local Console Display ----
    print("\n" + "=" * 70)
    print(f"[Sentinel AI] Payload Generated @ {timestamp}")
    print("=" * 70)
    print(json.dumps(payload, indent=4))
    print("=" * 70)

    # ---- Send to Local Server ----
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers=headers,
            timeout=TIMEOUT
        )
        print(f"[Sender] Sent to local server | Status: {response.status_code}")
        return response.status_code

    except Exception as e:
        print("[Sender] Error sending data:", e)
        return None