import requests

API_URL = "http://probable-dollop-g4xw7j4gv66ghv9pw-5000.app.github.dev/api/logs"


def send(payload):
    """
    Sends ONE aggregated JSON payload to the backend.
    """
    if not payload:
        return

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers=headers,
            timeout=5
        )
        return response.status_code
    except Exception as e:
        print("[Sender] Error sending data:", e)
        return None