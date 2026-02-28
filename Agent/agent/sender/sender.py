import requests
import json
from datetime import datetime

API_URL = "http://127.0.0.1:5000/api/logs"
TIMEOUT = 5


def send(payload):
    """
    Sends ONE aggregated JSON payload to the local server
    and returns feedback (like trust score).
    """
    if not payload:
        return None

    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

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
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"[Sender] Success | Trust Score: {data.get('trust_score')} | Feedback: {data.get('feedback')}")
            return data
        else:
            print(f"[Sender] Server returned status: {response.status_code}")
            return None

    except Exception as e:
        print("[Sender] Error sending data:", e)
        return None