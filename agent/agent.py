
import psutil
import socket
import time
import requests
from config import DEVICE_ID, API_URL, SEND_INTERVAL


def get_ip_address():
    try:
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        return ip
    except:
        return "0.0.0.0"


def collect_system_data():
    cpu_usage = psutil.cpu_percent(interval=1)
    ram_usage = psutil.virtual_memory().percent
    process_count = len(psutil.pids())
    ip_address = get_ip_address()

    data = {
        "device_id": DEVICE_ID,
        "cpu": cpu_usage,
        "ram": ram_usage,
        "processes": process_count,
        "ip": ip_address
    }

    return data


def send_data(data):
    try:
        response = requests.post(
            API_URL,
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )

        print(f"[+] Sent data | Status: {response.status_code}")

    except Exception as e:
        print(f"[!] Failed to send data: {e}")


def main():
    print("[*] Sentinel Agent started...")

    while True:
        system_data = collect_system_data()
        print("[*] Collected:", system_data)

        send_data(system_data)

        time.sleep(SEND_INTERVAL)


if __name__ == "__main__":
    main()
