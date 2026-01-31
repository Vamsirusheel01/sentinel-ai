# sentinel_agent/sender/api_client.py

import requests

API_URL = "http://probable-dollop-g4xw7j4gv66ghv9pw-5000.app.github.dev/api/logs"
TIMEOUT = 5


def send_payload(payload):
    """
    Sends payload to backend
    """
    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(
        API_URL,
        json=payload,
        headers=headers,
        timeout=TIMEOUT
    )

    return response.status_code == 201