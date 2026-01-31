# sentinel_agent/sender/api_client.py

import os
import requests

from utils.config_loader import load_config

_CONFIG = load_config("config/agent_config.yaml")
_BACKEND_CONFIG = _CONFIG.get("backend", {})

API_URL = os.getenv("SENTINEL_BACKEND_URL", _BACKEND_CONFIG.get("api_url", "http://127.0.0.1:5000/api/logs"))
TIMEOUT = int(os.getenv("SENTINEL_BACKEND_TIMEOUT", _BACKEND_CONFIG.get("timeout_seconds", 5)))


def send_payload(payload):
    """
    Sends payload to backend
    """
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
    except requests.RequestException:
        return False

    return response.status_code == 201