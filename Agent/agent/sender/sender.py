import requests

API_URL = "http://<server-ip>:5000/api/logs"


def send(events):
    if not events:
        return
    try:
        requests.post(API_URL, json=events, timeout=5)
    except Exception:
        pass